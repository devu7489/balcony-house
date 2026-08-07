package com.thebalconyhouse.backend.booking;

import com.thebalconyhouse.backend.booking.dto.AdminBookingRequest;
import com.thebalconyhouse.backend.booking.dto.BookingDto;
import com.thebalconyhouse.backend.booking.dto.PaymentRequest;
import com.thebalconyhouse.backend.booking.dto.RoomNumberRequest;
import com.thebalconyhouse.backend.booking.dto.RoomUpgradeRequest;
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

    @PostMapping("/{id}/payment")
    public BookingDto recordPayment(@PathVariable Long id, @Valid @RequestBody PaymentRequest request) {
        return bookingService.recordPayment(id, request.amount(), request.method(), request.reference());
    }

    @PostMapping("/{id}/room-number")
    public BookingDto setRoomNumber(@PathVariable Long id, @RequestBody RoomNumberRequest request) {
        return bookingService.setRoomNumber(id, request.roomNumber());
    }

    @PostMapping("/{id}/upgrade")
    public BookingDto upgrade(@PathVariable Long id, @Valid @RequestBody RoomUpgradeRequest request) {
        return bookingService.upgradeRoom(id, request.newPropertyId());
    }

    @GetMapping("/group/{groupId}")
    public List<BookingDto> group(@PathVariable Long groupId) {
        return bookingService.findByGroupId(groupId);
    }

    @PostMapping("/group/{groupId}/check-in")
    public List<BookingDto> checkInGroup(@PathVariable Long groupId) {
        return bookingService.checkInGroup(groupId);
    }

    @PostMapping("/group/{groupId}/check-out")
    public List<BookingDto> checkOutGroup(@PathVariable Long groupId) {
        return bookingService.checkOutGroup(groupId);
    }

    @PostMapping("/group/{groupId}/cancel")
    public List<BookingDto> cancelGroup(@PathVariable Long groupId) {
        return bookingService.cancelGroup(groupId);
    }

    @PostMapping("/group/{groupId}/payment")
    public List<BookingDto> recordGroupPayment(@PathVariable Long groupId, @Valid @RequestBody PaymentRequest request) {
        return bookingService.recordGroupPayment(groupId, request.amount(), request.method(), request.reference());
    }
}
