package com.thebalconyhouse.backend.booking;

import com.thebalconyhouse.backend.booking.dto.BookingDto;
import com.thebalconyhouse.backend.booking.dto.BookingGroupRequest;
import com.thebalconyhouse.backend.booking.dto.BookingRequest;
import com.thebalconyhouse.backend.booking.dto.InvoiceDto;
import com.thebalconyhouse.backend.notification.BookingEmailService;
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
    private final InvoiceService invoiceService;
    private final BookingEmailService bookingEmailService;
    public BookingController(BookingService bookingService, InvoiceService invoiceService, BookingEmailService bookingEmailService) {
        this.bookingService = bookingService;
        this.invoiceService = invoiceService;
        this.bookingEmailService = bookingEmailService;
    }

    @GetMapping("/mine")
    public List<BookingDto> mine(@AuthenticationPrincipal OAuth2User principal) {
        return bookingService.findMine(principal.getAttribute("email"));
    }

    @PostMapping
    public BookingDto create(@Valid @RequestBody BookingRequest request, @AuthenticationPrincipal OAuth2User principal) {
        BookingDto dto = bookingService.create(request, principal.getAttribute("email"), principal.getAttribute("name"));
        // The first payment attempt happens inside create() and typically fails under the
        // mock gateway (see PaymentGateway) - only send "you're confirmed" once it's actually
        // paid, not the moment the room is merely held.
        if (dto.paymentStatus() == PaymentStatus.PAID) {
            bookingEmailService.sendConfirmation(List.of(dto));
        }
        return dto;
    }

    @PostMapping("/group")
    public List<BookingDto> createGroup(@Valid @RequestBody BookingGroupRequest request, @AuthenticationPrincipal OAuth2User principal) {
        List<BookingDto> dtos = bookingService.createGroup(request, principal.getAttribute("email"), principal.getAttribute("name"));
        if (dtos.stream().allMatch(d -> d.paymentStatus() == PaymentStatus.PAID)) {
            bookingEmailService.sendConfirmation(dtos);
        }
        return dtos;
    }

    @PostMapping("/{id}/pay")
    public BookingDto pay(@PathVariable Long id, @AuthenticationPrincipal OAuth2User principal) {
        BookingDto dto = bookingService.retryPayment(id, principal.getAttribute("email"));
        if (dto.paymentStatus() == PaymentStatus.PAID) {
            bookingEmailService.sendConfirmation(List.of(dto));
        }
        return dto;
    }

    @PostMapping("/{id}/cancel")
    public BookingDto cancel(@PathVariable Long id, @AuthenticationPrincipal OAuth2User principal) {
        BookingDto dto = bookingService.cancelOwn(id, principal.getAttribute("email"));
        bookingEmailService.sendCancellation(List.of(dto));
        return dto;
    }

    @PostMapping("/group/{groupId}/cancel")
    public List<BookingDto> cancelGroup(@PathVariable Long groupId, @AuthenticationPrincipal OAuth2User principal) {
        List<BookingDto> dtos = bookingService.cancelOwnGroup(groupId, principal.getAttribute("email"));
        bookingEmailService.sendCancellation(dtos);
        return dtos;
    }

    @PostMapping("/group/{groupId}/pay")
    public List<BookingDto> payGroup(@PathVariable Long groupId, @AuthenticationPrincipal OAuth2User principal) {
        List<BookingDto> dtos = bookingService.retryGroupPayment(groupId, principal.getAttribute("email"));
        if (dtos.stream().allMatch(d -> d.paymentStatus() == PaymentStatus.PAID)) {
            bookingEmailService.sendConfirmation(dtos);
        }
        return dtos;
    }

    @GetMapping("/{id}/invoice")
    public InvoiceDto invoice(@PathVariable Long id, @AuthenticationPrincipal OAuth2User principal) {
        return invoiceService.forOwnBooking(id, principal.getAttribute("email"));
    }

    @GetMapping("/group/{groupId}/invoice")
    public InvoiceDto groupInvoice(@PathVariable Long groupId, @AuthenticationPrincipal OAuth2User principal) {
        return invoiceService.forOwnGroup(groupId, principal.getAttribute("email"));
    }
}
