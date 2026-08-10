package com.thebalconyhouse.backend.addon;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Refund is "pay for what you used, at the room you were actually in": full refund of the
 * room charge if check-in hasn't arrived yet, otherwise the unused (remaining) room-nights are
 * refunded at the CURRENT room's per-night rate - not a flat fraction of the whole booking
 * total. That distinction matters once a room has been changed mid-stay (see
 * BookingService.upgradeRoom, limited to once per stay): the nights already spent were
 * correctly billed at the old room's rate when the change happened, but a flat elapsed/total
 * fraction of that blended total would misprice the still-unused nights - which are always
 * entirely at the current room's rate, since no further change can happen after the one
 * allowed upgrade.
 *
 * Kids Play Zone, Full Board, and café orders are deliberately NOT prorated by remaining
 * nights here, unlike the room charge - they're billed by sessions/items a staff member
 * records as actually consumed (see BookingService.applyAddons/addFoodOrder), not a flat
 * daily reservation for the whole stay. A fee that only exists because it was already logged
 * as used has nothing left to refund, regardless of how many room-nights remain; they're
 * simply part of what's owed, same as an ordinary bill, not part of the cancellation penalty.
 * (This only matters for childcare/fullBoard/food already on the booking at cancel time - see
 * BookingService.requireEditable for why none of the three can be added at all before
 * check-in, which keeps this non-issue for a pre-arrival cancellation.)
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
                                   BigDecimal currentRoomPerNightRate, int discountPercent, BigDecimal payableTotal) {
        if (totalNights <= 0) {
            return new Result(BigDecimal.ZERO);
        }
        long elapsedNights = Math.max(0, Math.min(totalNights, ChronoUnit.DAYS.between(checkIn, today)));
        long remainingNights = totalNights - elapsedNights;

        BigDecimal roomRefund = currentRoomPerNightRate.multiply(BigDecimal.valueOf(remainingNights));
        BigDecimal discountMultiplier = BigDecimal.valueOf(100 - discountPercent)
                .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
        BigDecimal refundAmount = roomRefund.multiply(discountMultiplier).setScale(2, RoundingMode.HALF_UP);

        BigDecimal penalty = payableTotal.subtract(refundAmount);
        penalty = penalty.max(BigDecimal.ZERO).min(payableTotal.max(BigDecimal.ZERO));
        return new Result(penalty);
    }
}
