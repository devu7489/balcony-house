package com.thebalconyhouse.backend.auth;

import com.thebalconyhouse.backend.auth.dto.SessionStatusDto;
import com.thebalconyhouse.backend.auth.dto.UserDto;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Exposes only what the React app needs to know about auth state.
 * No tokens ever leave the server - the client only ever sees this shape.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @GetMapping("/me")
    public UserDto me(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) {
            return null; // 200 with null body -> frontend treats as "not logged in"
        }
        return new UserDto(
                principal.getAttribute("email"),
                principal.getAttribute("name"),
                principal.getAttribute("picture")
        );
    }

    @GetMapping("/session")
    public SessionStatusDto session(HttpServletRequest request) {
        boolean hasSession = request.getSession(false) != null
                && request.getUserPrincipal() != null;
        Long remaining = null;
        if (hasSession) {
            var session = request.getSession(false);
            remaining = (long) session.getMaxInactiveInterval();
        }
        return new SessionStatusDto(hasSession, remaining);
    }

    // Logout is handled declaratively by Spring Security (see SecurityConfig:
    // POST /api/auth/logout invalidates the session and clears cookies).
}
