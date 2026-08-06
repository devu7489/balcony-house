package com.thebalconyhouse.backend.auth;

import com.thebalconyhouse.backend.auth.dto.SessionStatusDto;
import com.thebalconyhouse.backend.auth.dto.UserDto;
import com.thebalconyhouse.backend.profile.GuestProfile;
import com.thebalconyhouse.backend.profile.GuestProfileRepository;
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

    private final GuestProfileRepository guestProfileRepository;
    public AuthController(GuestProfileRepository guestProfileRepository) {
        this.guestProfileRepository = guestProfileRepository;
    }

    @GetMapping("/me")
    public UserDto me(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) {
            return null; // 200 with null body -> frontend treats as "not logged in"
        }
        boolean isAdmin = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        String email = principal.getAttribute("email");
        GuestProfile profile = guestProfileRepository.findByEmail(email).orElse(null);
        return new UserDto(
                email,
                principal.getAttribute("name"),
                principal.getAttribute("picture"),
                isAdmin,
                profile != null ? profile.getPhone() : null,
                profile != null ? profile.getGender() : null,
                profile != null ? profile.getDateOfBirth() : null
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
