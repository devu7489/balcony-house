package com.thebalconyhouse.backend.booking;

import com.thebalconyhouse.backend.booking.dto.BookingDto;
import com.thebalconyhouse.backend.booking.dto.BookingRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * All endpoints here require an authenticated session (see SecurityConfig:
 * /api/bookings/** -> authenticated()). The OAuth2User principal is resolved
 * from the session by Spring Security - no token handling needed here.
 */
@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;
    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping("/mine")
    public List<BookingDto> mine(@AuthenticationPrincipal OAuth2User principal) {
        return bookingService.findMine(principal.getAttribute("email"));
    }

    @PostMapping
    public BookingDto create(@Valid @RequestBody BookingRequest request, @AuthenticationPrincipal OAuth2User principal) {
        return bookingService.create(request, principal.getAttribute("email"), principal.getAttribute("name"));
    }

    @PostMapping("/{id}/cancel")
    public BookingDto cancel(@PathVariable Long id, @AuthenticationPrincipal OAuth2User principal) {
        return bookingService.cancelOwn(id, principal.getAttribute("email"));
    }
}
