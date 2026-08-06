package com.thebalconyhouse.backend.profile;

import com.thebalconyhouse.backend.profile.dto.GuestProfileDto;
import com.thebalconyhouse.backend.profile.dto.GuestProfileRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

/**
 * Personal profile data (phone/gender/DOB), keyed by the caller's Google email.
 * Gated by SecurityConfig (/api/profile/** -> authenticated()) - never public.
 */
@RestController
@RequestMapping("/api/profile")
public class GuestProfileController {

    private final GuestProfileRepository repository;
    public GuestProfileController(GuestProfileRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/me")
    public GuestProfileDto me(@AuthenticationPrincipal OAuth2User principal) {
        String email = principal.getAttribute("email");
        return repository.findByEmail(email)
                .map(this::toDto)
                .orElse(new GuestProfileDto(email, null, null, null));
    }

    @PutMapping("/me")
    public GuestProfileDto save(@Valid @RequestBody GuestProfileRequest request, @AuthenticationPrincipal OAuth2User principal) {
        String email = principal.getAttribute("email");
        GuestProfile profile = repository.findByEmail(email)
                .orElseGet(() -> new GuestProfile(email, null, null, null));
        profile.update(request.phone(), request.gender(), request.dateOfBirth());
        return toDto(repository.save(profile));
    }

    private GuestProfileDto toDto(GuestProfile p) {
        return new GuestProfileDto(p.getEmail(), p.getPhone(), p.getGender(), p.getDateOfBirth());
    }
}
