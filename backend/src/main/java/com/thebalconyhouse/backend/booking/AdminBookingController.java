package com.thebalconyhouse.backend.booking;

import com.thebalconyhouse.backend.booking.dto.AddonUpdateRequest;
import com.thebalconyhouse.backend.booking.dto.AdminBookingRequest;
import com.thebalconyhouse.backend.booking.dto.BookingActivityDto;
import com.thebalconyhouse.backend.booking.dto.BookingDto;
import com.thebalconyhouse.backend.booking.dto.FoodOrderRequest;
import com.thebalconyhouse.backend.booking.dto.InvoiceDto;
import com.thebalconyhouse.backend.booking.dto.PaymentRequest;
import com.thebalconyhouse.backend.booking.dto.RoomNumberRequest;
import com.thebalconyhouse.backend.booking.dto.RoomUpgradeRequest;
import com.thebalconyhouse.backend.cafe.CafeItem;
import com.thebalconyhouse.backend.cafe.CafeRepository;
import com.thebalconyhouse.backend.notification.BookingEmailService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
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
    private final BookingActivityLogService activityLogService;
    private final RoomStatusService roomStatusService;
    private final CafeRepository cafeRepository;

    public AdminBookingController(BookingService bookingService, InvoiceService invoiceService,
                                   BookingEmailService bookingEmailService, BookingActivityLogService activityLogService,
                                   RoomStatusService roomStatusService, CafeRepository cafeRepository) {
        this.bookingService = bookingService;
        this.invoiceService = invoiceService;
        this.bookingEmailService = bookingEmailService;
        this.activityLogService = activityLogService;
        this.roomStatusService = roomStatusService;
        this.cafeRepository = cafeRepository;
    }

    /** Just for readable activity-log details - the actual order always snapshots the item
     *  name/price itself (see FoodOrder), this is only cosmetic for the log entry text. */
    private String menuItemName(Long cafeItemId) {
        return cafeRepository.findById(cafeItemId).map(CafeItem::getName).orElse("item");
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
    public BookingDto create(@Valid @RequestBody AdminBookingRequest request, @AuthenticationPrincipal OAuth2User principal) {
        BookingDto dto = bookingService.createForAdmin(request);
        bookingEmailService.sendConfirmation(List.of(dto));
        activityLogService.record(dto.id(), dto.bookingGroupId(), "CREATED", email(principal),
                "Phone booking for " + dto.guestName());
        return dto;
    }

    @PostMapping("/{id}/check-in")
    public BookingDto checkIn(@PathVariable Long id, @AuthenticationPrincipal OAuth2User principal) {
        BookingDto dto = bookingService.checkIn(id);
        bookingEmailService.sendCheckIn(List.of(dto));
        activityLogService.record(dto.id(), dto.bookingGroupId(), "CHECKED_IN", email(principal), null);
        return dto;
    }

    @PostMapping("/{id}/check-out")
    public BookingDto checkOut(@PathVariable Long id, @AuthenticationPrincipal OAuth2User principal) {
        BookingDto dto = bookingService.checkOut(id);
        bookingEmailService.sendCheckoutInvoice(List.of(dto), invoiceService.forBooking(id));
        activityLogService.record(dto.id(), dto.bookingGroupId(), "CHECKED_OUT", email(principal), null);
        roomStatusService.markDirty(dto.propertyId(), dto.roomNumber(), email(principal));
        return dto;
    }

    @PostMapping("/{id}/cancel")
    public BookingDto cancel(@PathVariable Long id, @AuthenticationPrincipal OAuth2User principal) {
        BookingDto dto = bookingService.cancel(id);
        bookingEmailService.sendCancellation(List.of(dto));
        String details = dto.cancellationPenaltyAmount() != null && dto.cancellationPenaltyAmount().signum() > 0
                ? "Cancellation penalty: ₹" + dto.cancellationPenaltyAmount()
                : null;
        activityLogService.record(dto.id(), dto.bookingGroupId(), "CANCELLED", email(principal), details);
        return dto;
    }

    /**
     * Cancels with no refund recorded through the system - for when the front desk is moving
     * a guest to a different room offline (a second room change beyond the one normal
     * upgrade this booking already used, or any other case handled outside the app) and the
     * money already collected covers that arrangement.
     */
    @PostMapping("/{id}/cancel-no-refund")
    public BookingDto cancelNoRefund(@PathVariable Long id, @AuthenticationPrincipal OAuth2User principal) {
        BookingDto dto = bookingService.cancelNoRefund(id);
        bookingEmailService.sendCancellation(List.of(dto));
        activityLogService.record(dto.id(), dto.bookingGroupId(), "CANCELLED_NO_REFUND", email(principal),
                "Cancelled with no refund - handled offline");
        return dto;
    }

    @PostMapping("/group/{groupId}/cancel-no-refund")
    public List<BookingDto> cancelGroupNoRefund(@PathVariable Long groupId, @AuthenticationPrincipal OAuth2User principal) {
        List<BookingDto> dtos = bookingService.cancelGroupNoRefund(groupId);
        bookingEmailService.sendCancellation(dtos);
        activityLogService.record(null, groupId, "CANCELLED_NO_REFUND", email(principal),
                "Whole trip cancelled with no refund - handled offline");
        return dtos;
    }

    @PostMapping("/{id}/payment")
    public BookingDto recordPayment(@PathVariable Long id, @Valid @RequestBody PaymentRequest request,
                                     @AuthenticationPrincipal OAuth2User principal) {
        BookingDto dto = bookingService.recordPayment(id, request.amount(), request.method(), request.reference());
        boolean isRefund = request.amount() != null && request.amount().signum() < 0;
        activityLogService.record(dto.id(), dto.bookingGroupId(), isRefund ? "REFUND_RECORDED" : "PAYMENT_RECORDED",
                email(principal), (request.amount() != null ? "₹" + request.amount().abs() : "full balance") + " via " + request.method());
        return dto;
    }

    @PostMapping("/{id}/room-number")
    public BookingDto setRoomNumber(@PathVariable Long id, @RequestBody RoomNumberRequest request,
                                     @AuthenticationPrincipal OAuth2User principal) {
        BookingDto dto = bookingService.setRoomNumber(id, request.roomNumber());
        activityLogService.record(dto.id(), dto.bookingGroupId(), "ROOM_NUMBER_SET", email(principal),
                "Set to " + (request.roomNumber() == null || request.roomNumber().isBlank() ? "Unassigned" : request.roomNumber()));
        return dto;
    }

    @PostMapping("/{id}/upgrade")
    public BookingDto upgrade(@PathVariable Long id, @Valid @RequestBody RoomUpgradeRequest request,
                               @AuthenticationPrincipal OAuth2User principal) {
        BookingDto before = bookingService.findById(id);
        BookingDto dto = bookingService.upgradeRoom(id, request.newPropertyId());
        activityLogService.record(dto.id(), dto.bookingGroupId(), "ROOM_CHANGED", email(principal),
                "From " + before.propertyName() + " to " + dto.propertyName());
        return dto;
    }

    @PostMapping("/{id}/addons")
    public BookingDto updateAddons(@PathVariable Long id, @Valid @RequestBody AddonUpdateRequest request,
                                    @AuthenticationPrincipal OAuth2User principal) {
        BookingDto dto = bookingService.updateAddons(id, request.childrenCount(), request.childcareSessions(), request.buffetSessions());
        activityLogService.record(dto.id(), dto.bookingGroupId(), "ADDONS_UPDATED", email(principal), addonsDetails(request));
        return dto;
    }

    @PostMapping("/group/{groupId}/addons")
    public List<BookingDto> updateGroupAddons(@PathVariable Long groupId, @Valid @RequestBody AddonUpdateRequest request,
                                               @AuthenticationPrincipal OAuth2User principal) {
        List<BookingDto> dtos = bookingService.updateGroupAddons(groupId, request.childrenCount(), request.childcareSessions(), request.buffetSessions());
        activityLogService.record(null, groupId, "ADDONS_UPDATED", email(principal), addonsDetails(request));
        return dtos;
    }

    private static String addonsDetails(AddonUpdateRequest request) {
        return "Kids Play Zone: " + request.childrenCount() + " child" + (request.childrenCount() == 1 ? "" : "ren")
                + ", " + request.childcareSessions() + " session" + (request.childcareSessions() == 1 ? "" : "s")
                + " · Full Board: " + request.buffetSessions() + " buffet session" + (request.buffetSessions() == 1 ? "" : "s");
    }

    @PostMapping("/{id}/food-orders")
    public BookingDto addFoodOrder(@PathVariable Long id, @Valid @RequestBody FoodOrderRequest request,
                                    @AuthenticationPrincipal OAuth2User principal) {
        BookingDto dto = bookingService.addFoodOrder(id, request.cafeItemId(), request.quantity());
        activityLogService.record(dto.id(), dto.bookingGroupId(), "FOOD_ORDER_ADDED", email(principal),
                request.quantity() + "x " + menuItemName(request.cafeItemId()));
        return dto;
    }

    @DeleteMapping("/{id}/food-orders/{orderId}")
    public BookingDto removeFoodOrder(@PathVariable Long id, @PathVariable Long orderId,
                                       @AuthenticationPrincipal OAuth2User principal) {
        BookingDto dto = bookingService.removeFoodOrder(id, orderId);
        activityLogService.record(dto.id(), dto.bookingGroupId(), "FOOD_ORDER_REMOVED", email(principal),
                "Order #" + orderId + " removed");
        return dto;
    }

    @PostMapping("/group/{groupId}/food-orders")
    public List<BookingDto> addGroupFoodOrder(@PathVariable Long groupId, @Valid @RequestBody FoodOrderRequest request,
                                               @AuthenticationPrincipal OAuth2User principal) {
        List<BookingDto> dtos = bookingService.addGroupFoodOrder(groupId, request.cafeItemId(), request.quantity());
        activityLogService.record(null, groupId, "FOOD_ORDER_ADDED", email(principal),
                request.quantity() + "x " + menuItemName(request.cafeItemId()));
        return dtos;
    }

    @DeleteMapping("/group/{groupId}/food-orders/{orderId}")
    public List<BookingDto> removeGroupFoodOrder(@PathVariable Long groupId, @PathVariable Long orderId,
                                                  @AuthenticationPrincipal OAuth2User principal) {
        List<BookingDto> dtos = bookingService.removeGroupFoodOrder(groupId, orderId);
        activityLogService.record(null, groupId, "FOOD_ORDER_REMOVED", email(principal),
                "Order #" + orderId + " removed");
        return dtos;
    }

    @GetMapping("/group/{groupId}")
    public List<BookingDto> group(@PathVariable Long groupId) {
        return bookingService.findByGroupId(groupId);
    }

    @PostMapping("/group/{groupId}/check-in")
    public List<BookingDto> checkInGroup(@PathVariable Long groupId, @AuthenticationPrincipal OAuth2User principal) {
        List<BookingDto> dtos = bookingService.checkInGroup(groupId);
        bookingEmailService.sendCheckIn(dtos);
        activityLogService.record(null, groupId, "CHECKED_IN", email(principal), "Whole trip");
        return dtos;
    }

    @PostMapping("/group/{groupId}/check-out")
    public List<BookingDto> checkOutGroup(@PathVariable Long groupId, @AuthenticationPrincipal OAuth2User principal) {
        // Only the rooms actually still CHECKED_IN before this call transition just now -
        // checkOutGroup leaves already-checked-out rooms untouched, so without this filter
        // every already-clean room from an earlier partial checkout would get re-dirtied.
        var wasCheckedIn = bookingService.findByGroupId(groupId).stream()
                .filter(b -> b.status() == BookingStatus.CHECKED_IN)
                .map(BookingDto::id)
                .collect(java.util.stream.Collectors.toSet());
        List<BookingDto> dtos = bookingService.checkOutGroup(groupId);
        bookingEmailService.sendCheckoutInvoice(dtos, invoiceService.forGroup(groupId));
        activityLogService.record(null, groupId, "CHECKED_OUT", email(principal), "Whole trip");
        dtos.stream().filter(dto -> wasCheckedIn.contains(dto.id()))
                .forEach(dto -> roomStatusService.markDirty(dto.propertyId(), dto.roomNumber(), email(principal)));
        return dtos;
    }

    @PostMapping("/group/{groupId}/cancel")
    public List<BookingDto> cancelGroup(@PathVariable Long groupId, @AuthenticationPrincipal OAuth2User principal) {
        List<BookingDto> dtos = bookingService.cancelGroup(groupId);
        bookingEmailService.sendCancellation(dtos);
        var totalPenalty = dtos.stream()
                .map(BookingDto::cancellationPenaltyAmount)
                .filter(java.util.Objects::nonNull)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        String details = totalPenalty.signum() > 0 ? "Whole trip · cancellation penalty: ₹" + totalPenalty : "Whole trip";
        activityLogService.record(null, groupId, "CANCELLED", email(principal), details);
        return dtos;
    }

    @PostMapping("/group/{groupId}/payment")
    public List<BookingDto> recordGroupPayment(@PathVariable Long groupId, @Valid @RequestBody PaymentRequest request,
                                                @AuthenticationPrincipal OAuth2User principal) {
        List<BookingDto> dtos = bookingService.recordGroupPayment(groupId, request.amount(), request.method(), request.reference());
        boolean isRefund = request.amount() != null && request.amount().signum() < 0;
        activityLogService.record(null, groupId, isRefund ? "REFUND_RECORDED" : "PAYMENT_RECORDED", email(principal),
                (request.amount() != null ? "₹" + request.amount().abs() : "full balance") + " via " + request.method());
        return dtos;
    }

    @GetMapping("/{id}/invoice")
    public InvoiceDto invoice(@PathVariable Long id) {
        return invoiceService.forBooking(id);
    }

    @GetMapping("/group/{groupId}/invoice")
    public InvoiceDto groupInvoice(@PathVariable Long groupId) {
        return invoiceService.forGroup(groupId);
    }

    @GetMapping("/{id}/activity")
    public List<BookingActivityDto> activity(@PathVariable Long id) {
        return activityLogService.findForBooking(id);
    }

    @GetMapping("/group/{groupId}/activity")
    public List<BookingActivityDto> groupActivity(@PathVariable Long groupId) {
        List<Long> bookingIds = bookingService.findByGroupId(groupId).stream().map(BookingDto::id).toList();
        return activityLogService.findForGroup(groupId, bookingIds);
    }

    private static String email(OAuth2User principal) {
        Object email = principal.getAttribute("email");
        return email != null ? email.toString() : "unknown";
    }
}
