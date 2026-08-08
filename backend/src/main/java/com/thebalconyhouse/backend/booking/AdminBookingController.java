package com.thebalconyhouse.backend.booking;

import com.thebalconyhouse.backend.booking.dto.AdminBookingRequest;
import com.thebalconyhouse.backend.booking.dto.BookingDto;
import com.thebalconyhouse.backend.booking.dto.InvoiceDto;
import com.thebalconyhouse.backend.booking.dto.PaymentRequest;
import com.thebalconyhouse.backend.booking.dto.RoomNumberRequest;
import com.thebalconyhouse.backend.booking.dto.RoomUpgradeRequest;
import com.thebalconyhouse.backend.notification.BookingEmailService;
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
    private final InvoiceService invoiceService;
    private final BookingEmailService bookingEmailService;
    public AdminBookingController(BookingService bookingService, InvoiceService invoiceService, BookingEmailService bookingEmailService) {
        this.bookingService = bookingService;
        this.invoiceService = invoiceService;
        this.bookingEmailService = bookingEmailService;
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
        BookingDto dto = bookingService.createForAdmin(request);
        bookingEmailService.sendConfirmation(List.of(dto));
        return dto;
    }

    @PostMapping("/{id}/check-in")
    public BookingDto checkIn(@PathVariable Long id) {
        BookingDto dto = bookingService.checkIn(id);
        bookingEmailService.sendCheckIn(List.of(dto));
        return dto;
    }

    @PostMapping("/{id}/check-out")
    public BookingDto checkOut(@PathVariable Long id) {
        BookingDto dto = bookingService.checkOut(id);
        bookingEmailService.sendCheckoutInvoice(List.of(dto), invoiceService.forBooking(id));
        return dto;
    }

    @PostMapping("/{id}/cancel")
    public BookingDto cancel(@PathVariable Long id) {
        BookingDto dto = bookingService.cancel(id);
        bookingEmailService.sendCancellation(List.of(dto));
        return dto;
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
        List<BookingDto> dtos = bookingService.checkInGroup(groupId);
        bookingEmailService.sendCheckIn(dtos);
        return dtos;
    }

    @PostMapping("/group/{groupId}/check-out")
    public List<BookingDto> checkOutGroup(@PathVariable Long groupId) {
        List<BookingDto> dtos = bookingService.checkOutGroup(groupId);
        bookingEmailService.sendCheckoutInvoice(dtos, invoiceService.forGroup(groupId));
        return dtos;
    }

    @PostMapping("/group/{groupId}/cancel")
    public List<BookingDto> cancelGroup(@PathVariable Long groupId) {
        List<BookingDto> dtos = bookingService.cancelGroup(groupId);
        bookingEmailService.sendCancellation(dtos);
        return dtos;
    }

    @PostMapping("/group/{groupId}/payment")
    public List<BookingDto> recordGroupPayment(@PathVariable Long groupId, @Valid @RequestBody PaymentRequest request) {
        return bookingService.recordGroupPayment(groupId, request.amount(), request.method(), request.reference());
    }

    @GetMapping("/{id}/invoice")
    public InvoiceDto invoice(@PathVariable Long id) {
        return invoiceService.forBooking(id);
    }

    @GetMapping("/group/{groupId}/invoice")
    public InvoiceDto groupInvoice(@PathVariable Long groupId) {
        return invoiceService.forGroup(groupId);
    }
}
