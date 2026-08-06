package com.thebalconyhouse.backend.booking;

import com.thebalconyhouse.backend.booking.dto.AdminBookingRequest;
import com.thebalconyhouse.backend.booking.dto.BookingDto;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * All endpoints here require ROLE_ADMIN (see SecurityConfig: /api/admin/** -> hasRole("ADMIN")),
 * granted to Google accounts listed in app.admin-emails.
 */
@RestController
@RequestMapping("/api/admin/bookings")
public class AdminBookingController {

    private final BookingService bookingService;
    public AdminBookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping
    public List<BookingDto> all() {
        return bookingService.findAll();
    }

    @GetMapping("/{id}")
    public BookingDto one(@PathVariable Long id) {
        return bookingService.findById(id);
    }

    @PostMapping
    public BookingDto create(@Valid @RequestBody AdminBookingRequest request) {
        return bookingService.createForAdmin(request);
    }

    @PostMapping("/{id}/check-in")
    public BookingDto checkIn(@PathVariable Long id) {
        return bookingService.checkIn(id);
    }

    @PostMapping("/{id}/check-out")
    public BookingDto checkOut(@PathVariable Long id) {
        return bookingService.checkOut(id);
    }

    @PostMapping("/{id}/cancel")
    public BookingDto cancel(@PathVariable Long id) {
        return bookingService.cancel(id);
    }
}
