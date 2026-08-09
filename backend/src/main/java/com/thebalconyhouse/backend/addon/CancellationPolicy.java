package com.thebalconyhouse.backend.addon;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Refund is "pay for what you used, at the room you were actually in": full refund if
 * check-in hasn't arrived yet, otherwise the unused (remaining) nights are refunded at the
 * CURRENT room's per-night rate - not a flat fraction of the whole booking total. That
 * distinction matters once a room has been changed mid-stay (see BookingService.upgradeRoom,
 * limited to once per stay): the nights already spent were correctly billed at the old
 * room's rate when the change happened, but a flat elapsed/total fraction of that blended
 * total would misprice the still-unused nights - which are always entirely at the current
 * room's rate, since no further change can happen after the one allowed upgrade.
 *
 * Kids Play Zone and Full Board are flat daily rates untouched by room changes, so their
 * unused portion is simply the same nights fraction of what was charged. Any admin-applied
 * discount percent is re-applied to the refundable subtotal, consistent with how it reduced
 * the original charge.
 *
 * A no-show is treated the same as an actual stay - once a night's date has passed, it's
 * used, whether or not the guest showed up.
 *
 * This only calculates the penalty - it's a pure function with no knowledge of payments or
 * refunds. There's no payment gateway in this app, so nothing here moves money; it's up to
 * the front desk to actually refund the difference and record it (see the negative-payment
 * refund flow in BookingService), same as any other refund.
 */
public final class CancellationPolicy {

    private CancellationPolicy() {}

    public record Result(BigDecimal penaltyAmount) {}

    public static Result evaluate(LocalDate checkIn, LocalDate today, long totalNights,
                                   BigDecimal currentRoomPerNightRate, BigDecimal childcareFee, BigDecimal fullBoardFee,
                                   int discountPercent, BigDecimal payableTotal) {
        if (totalNights <= 0) {
            return new Result(BigDecimal.ZERO);
        }
        long elapsedNights = Math.max(0, Math.min(totalNights, ChronoUnit.DAYS.between(checkIn, today)));
        long remainingNights = totalNights - elapsedNights;

        BigDecimal roomRefund = currentRoomPerNightRate.multiply(BigDecimal.valueOf(remainingNights));
        BigDecimal childcareRefund = fraction(childcareFee, remainingNights, totalNights);
        BigDecimal fullBoardRefund = fraction(fullBoardFee, remainingNights, totalNights);

        BigDecimal subtotalRefund = roomRefund.add(childcareRefund).add(fullBoardRefund);
        BigDecimal discountMultiplier = BigDecimal.valueOf(100 - discountPercent)
                .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
        BigDecimal refundAmount = subtotalRefund.multiply(discountMultiplier).setScale(2, RoundingMode.HALF_UP);

        BigDecimal penalty = payableTotal.subtract(refundAmount);
        penalty = penalty.max(BigDecimal.ZERO).min(payableTotal.max(BigDecimal.ZERO));
        return new Result(penalty);
    }

    private static BigDecimal fraction(BigDecimal total, long remainingNights, long totalNights) {
        if (total == null || total.signum() == 0) return BigDecimal.ZERO;
        return total.multiply(BigDecimal.valueOf(remainingNights))
                .divide(BigDecimal.valueOf(totalNights), 2, RoundingMode.HALF_UP);
    }
}
