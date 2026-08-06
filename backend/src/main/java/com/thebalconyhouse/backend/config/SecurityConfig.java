package com.thebalconyhouse.backend.config;

import com.thebalconyhouse.backend.audit.AuditLogService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Core security configuration.
 *
 * Design goals (per architecture requirements):
 *  - OAuth2 / OIDC login (Google) handled entirely server-side.
 *  - Access & refresh tokens never reach the browser; only a secure,
 *    HttpOnly session cookie (see application.yml: server.servlet.session.cookie) is issued.
 *  - CSRF protection kept ON for session-based auth, token delivered via a
 *    readable (non-HttpOnly) cookie so the SPA can echo it back in a header,
 *    the standard "double submit cookie" pattern for cookie/session auth.
 *  - Stateless clients (curl/mobile) are not a target; this is a classic
 *    server-rendered-session SPA-backend split.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final AuditLogService auditLogService;
    private final String frontendUrl;
    private final List<String> allowedOrigins;
    private final Set<String> adminEmails;

    public SecurityConfig(AuditLogService auditLogService,
                           @Value("${app.frontend-url}") String frontendUrl,
                           @Value("${app.cors.allowed-origins}") String allowedOrigins,
                           @Value("${app.admin-emails}") String adminEmails) {
        this.auditLogService = auditLogService;
        this.frontendUrl = frontendUrl;
        this.allowedOrigins = List.of(allowedOrigins.split(","));
        this.adminEmails = Arrays.stream(adminEmails.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
    }

    /**
     * Wraps the default OIDC user-loading with a small authority bump: if the
     * authenticated Google account's email is in app.admin-emails, grant ROLE_ADMIN
     * on top of the normal scopes. No local user/role table - the allow-list is the
     * source of truth, appropriate for a single-owner property.
     */
    private OAuth2UserService<OidcUserRequest, OidcUser> oidcUserService() {
        OidcUserService delegate = new OidcUserService();
        return request -> {
            OidcUser oidcUser = delegate.loadUser(request);
            if (adminEmails.contains(oidcUser.getEmail())) {
                Set<GrantedAuthority> authorities = new HashSet<>(oidcUser.getAuthorities());
                authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                return new DefaultOidcUser(authorities, oidcUser.getIdToken(), oidcUser.getUserInfo());
            }
            return oidcUser;
        };
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        CsrfTokenRequestAttributeHandler requestHandler = new CsrfTokenRequestAttributeHandler();
        requestHandler.setCsrfRequestAttributeName(null);

        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .csrfTokenRequestHandler(requestHandler)
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                .sessionFixation(fixation -> fixation.migrateSession())
                .maximumSessions(1)
                .maxSessionsPreventsLogin(false)
            )
            .authorizeHttpRequests(auth -> auth
                // Public, read-only content
                .requestMatchers(org.springframework.http.HttpMethod.GET,
                        "/api/properties/**",
                        "/api/gallery/**",
                        "/api/experiences/**",
                        "/api/cafe/**",
                        "/api/journal/**",
                        "/api/auth/me",
                        "/api/auth/session",
                        "/actuator/health"
                ).permitAll()
                // Public write endpoints (enquiries, subscriptions)
                .requestMatchers(org.springframework.http.HttpMethod.POST,
                        "/api/contact/**",
                        "/api/newsletter/**"
                ).permitAll()
                // Bookings and profile data require a signed-in guest; admin endpoints require ROLE_ADMIN
                .requestMatchers("/api/bookings/**", "/api/profile/**").authenticated()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth2 -> oauth2
                .authorizationEndpoint(a -> a.baseUri("/oauth2/authorization"))
                .redirectionEndpoint(r -> r.baseUri("/login/oauth2/code/*"))
                .userInfoEndpoint(u -> u.oidcUserService(oidcUserService()))
                .successHandler((request, response, authentication) -> {
                    auditLogService.recordLoginSuccess(authentication.getName());
                    response.sendRedirect(frontendUrl);
                })
                .failureHandler((request, response, exception) -> {
                    auditLogService.recordLoginFailure(exception.getMessage());
                    response.sendRedirect(frontendUrl + "/login-error");
                })
            )
            .logout(logout -> logout
                .logoutUrl("/api/auth/logout")
                .deleteCookies("BALCONYSESSION", "XSRF-TOKEN")
                .invalidateHttpSession(true)
                .logoutSuccessHandler((request, response, authentication) -> {
                    if (authentication != null) {
                        auditLogService.recordLogout(authentication.getName());
                    }
                    response.setStatus(HttpServletResponse.SC_NO_CONTENT);
                })
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) ->
                        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Authentication required"))
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("X-XSRF-TOKEN"));
        // Required so the browser sends/receives the session + CSRF cookies
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
