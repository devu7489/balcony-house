package com.thebalconyhouse.backend.testimonial;

import com.thebalconyhouse.backend.testimonial.dto.GuestTestimonialRequest;
import com.thebalconyhouse.backend.testimonial.dto.TestimonialDto;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// GET here is public, no-auth (see SecurityConfig: /api/testimonials/** -> permitAll on GET) -
// except /booking/{id}, which needs a real guest session (see SecurityConfig's more specific
// matcher for that one path, added ahead of the broader permitAll rule).
@RestController
@RequestMapping("/api/testimonials")
public class TestimonialController {

    private final TestimonialService testimonialService;

    public TestimonialController(TestimonialService testimonialService) {
        this.testimonialService = testimonialService;
    }

    @GetMapping
    public List<TestimonialDto> all() {
        return testimonialService.findAll();
    }

    @GetMapping("/featured")
    public List<TestimonialDto> featured() {
        return testimonialService.findFeatured();
    }

    @GetMapping("/booking/{bookingId}")
    public TestimonialDto mineForBooking(@PathVariable Long bookingId, @AuthenticationPrincipal OAuth2User principal) {
        return testimonialService.findForOwnBooking(bookingId, principal.getAttribute("email"));
    }

    @PostMapping("/booking/{bookingId}")
    public TestimonialDto submit(@PathVariable Long bookingId, @Valid @RequestBody GuestTestimonialRequest request,
                                  @AuthenticationPrincipal OAuth2User principal) {
        return testimonialService.submitForBooking(bookingId, principal.getAttribute("email"), request);
    }
}
