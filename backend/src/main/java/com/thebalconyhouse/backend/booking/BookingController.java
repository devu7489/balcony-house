package com.thebalconyhouse.backend.booking;

import com.thebalconyhouse.backend.booking.dto.BookingDto;
import com.thebalconyhouse.backend.booking.dto.BookingRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

/**
 * All endpoints here require an authenticated session (see SecurityConfig:
 * /api/bookings/** -> authenticated()). The OAuth2User principal is resolved
 * from the session by Spring Security - no token handling needed here.
 */
@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingRepository repository;
    public BookingController(BookingRepository repository) { this.repository = repository; }

    @GetMapping("/mine")
    public List<BookingDto> mine(@AuthenticationPrincipal OAuth2User principal) {
        String email = principal.getAttribute("email");
        return repository.findByGuestEmail(email).stream()
                .map(b -> new BookingDto(b.getId(), b.getPropertyId(), b.getCheckIn(), b.getCheckOut(), b.getGuests()))
                .toList();
    }

    @PostMapping
    public BookingDto create(@Valid @RequestBody BookingRequest request, @AuthenticationPrincipal OAuth2User principal) {
        String email = principal.getAttribute("email");
        Booking saved = repository.save(new Booking(request.propertyId(), email,
                request.checkIn(), request.checkOut(), request.guests(), Instant.now()));
        return new BookingDto(saved.getId(), saved.getPropertyId(), saved.getCheckIn(), saved.getCheckOut(), saved.getGuests());
    }
}
