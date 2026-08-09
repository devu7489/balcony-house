package com.thebalconyhouse.backend.booking;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Regression test for the exact bug reported: pay a booking, change its room, and the
 * screen loses track of what was already collected. These cover the entity-level
 * invariant the fix depends on - setPaymentStatus (used when a room change invalidates
 * a PAID mark) must never touch amountPaid/method/reference, so that history survives.
 * The actual itemized Payment-row bookkeeping lives in BookingService.recordPaymentInternal.
 */
class BookingPaymentTrackingTest {

    private Booking newBooking() {
        return new Booking(1L, "guest@example.com", "Guest", "+91 90000 00000",
                LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 8), 2, null, Instant.now());
    }

    @Test
    void getFullTotal_includesAddonsAndDiscount() {
        Booking booking = newBooking();
        booking.setAmount(new BigDecimal("21000.00"));
        booking.setChildcare(1, new BigDecimal("4200.00"));
        booking.setFullBoard(true, new BigDecimal("7000.00"));
        booking.setDiscount(10, new BigDecimal("3220.00"));

        // 21000 + 4200 + 7000 - 3220 = 28980
        assertEquals(new BigDecimal("28980.00"), booking.getFullTotal());
    }

    @Test
    void roomChangeAfterPayment_preservesAmountPaidAndHistory() {
        Booking booking = newBooking();
        booking.setAmount(new BigDecimal("21000.00"));

        // Simulate what BookingService.recordPaymentInternal does after a full payment.
        booking.setAmountPaid(new BigDecimal("21000.00"));
        booking.setPaymentMethod("Cash");
        booking.setPaymentReference("receipt-88");
        booking.setInitialPayment(PaymentStatus.PAID, "Cash", "receipt-88");

        // Simulate BookingService.upgradeRoom: amount goes up, only the status flips.
        booking.setAmount(new BigDecimal("28000.00"));
        booking.setPaymentStatus(PaymentStatus.PENDING);

        assertEquals(PaymentStatus.PENDING, booking.getPaymentStatus());
        // The whole point of the fix: this must NOT have been wiped to zero/null.
        assertEquals(new BigDecimal("21000.00"), booking.getAmountPaid());
        assertEquals("Cash", booking.getPaymentMethod());
        assertEquals("receipt-88", booking.getPaymentReference());

        BigDecimal balanceDue = booking.getFullTotal().subtract(booking.getAmountPaid());
        assertEquals(new BigDecimal("7000.00"), balanceDue);
    }

    @Test
    void amountPaidDefaultsToZero_whenNeverSet() {
        Booking booking = newBooking();
        assertEquals(BigDecimal.ZERO, booking.getAmountPaid());
    }

    @Test
    void setInitialPayment_setsRawFieldsOnly_noAmountPaidSideEffect() {
        Booking booking = newBooking();
        booking.setAmount(new BigDecimal("15000.00"));

        booking.setInitialPayment(PaymentStatus.PAID, "Cash", "walk-in");

        assertEquals(PaymentStatus.PAID, booking.getPaymentStatus());
        assertEquals("Cash", booking.getPaymentMethod());
        // amountPaid is intentionally NOT set here anymore - BookingService.createInternal
        // must explicitly call recordPaymentInternal afterward to create the Payment row.
        assertEquals(BigDecimal.ZERO, booking.getAmountPaid());
    }
}
