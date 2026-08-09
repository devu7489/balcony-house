package com.thebalconyhouse.backend.booking;

import com.thebalconyhouse.backend.booking.dto.BookingDto;
import com.thebalconyhouse.backend.notification.BookingEmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Nudges, then releases, rooms held by a checkout nobody ever finished paying for - the
 * counterpart to PaymentGateway's mock always failing the first attempt: without this job,
 * an abandoned retry would hold that room forever. A reminder goes out once, partway through
 * the hold window (app.payment.reminder-minutes); if payment still isn't done by the end of
 * the window (app.payment.hold-minutes), the room is released. Set both low locally to watch
 * this fire quickly. One email per trip, not one per room, matching every other trip-level
 * action.
 */
@Component
public class PaymentHoldCleanupScheduler {

    private static final Logger log = LoggerFactory.getLogger(PaymentHoldCleanupScheduler.class);

    private final BookingService bookingService;
    private final BookingEmailService bookingEmailService;
    private final BookingActivityLogService activityLogService;

    public PaymentHoldCleanupScheduler(BookingService bookingService, BookingEmailService bookingEmailService,
                                        BookingActivityLogService activityLogService) {
        this.bookingService = bookingService;
        this.bookingEmailService = bookingEmailService;
        this.activityLogService = activityLogService;
    }

    @Scheduled(fixedRate = 5, timeUnit = TimeUnit.MINUTES)
    public void sweep() {
        sendReminders();
        releaseExpired();
    }

    private void sendReminders() {
        List<BookingDto> due = bookingService.findAndMarkPaymentReminders();
        if (due.isEmpty()) return;

        int trips = 0;
        for (List<BookingDto> trip : byTrip(due)) {
            bookingEmailService.sendPaymentReminder(trip);
            BookingDto first = trip.get(0);
            activityLogService.record(first.bookingGroupId() == null ? first.id() : null, first.bookingGroupId(),
                    "PAYMENT_REMINDER_SENT", "system", "Still unpaid - reminder sent, room held until the deadline");
            trips++;
        }
        log.info("Payment reminder sweep: nudged {} booking(s) across {} trip(s)", due.size(), trips);
    }

    private void releaseExpired() {
        List<BookingDto> cancelled = bookingService.cancelExpiredHolds();
        if (cancelled.isEmpty()) return;

        int trips = 0;
        for (List<BookingDto> trip : byTrip(cancelled)) {
            bookingEmailService.sendCancellation(trip);
            BookingDto first = trip.get(0);
            activityLogService.record(first.bookingGroupId() == null ? first.id() : null, first.bookingGroupId(),
                    "AUTO_CANCELLED", "system", "Payment never completed - room held past the deadline, released automatically");
            trips++;
        }
        log.info("Payment hold cleanup: released {} booking(s) across {} trip(s)", cancelled.size(), trips);
    }

    private Iterable<List<BookingDto>> byTrip(List<BookingDto> bookings) {
        Map<Long, List<BookingDto>> byGroup = bookings.stream()
                .collect(Collectors.groupingBy(b -> b.bookingGroupId() == null ? b.id() : b.bookingGroupId()));
        return byGroup.values();
    }
}
