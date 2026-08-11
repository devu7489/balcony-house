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
 * Kids Play Zone and Full Board are handled two different ways depending on whether the guest
 * ever actually checked in (see everCheckedIn):
 *   - Never checked in (cancelled before or without ever arriving): whatever fee is on the
 *     booking is still just the guest's original checkout-time reservation - staff can't touch
 *     it before check-in (see BookingService.requireEditable), so nothing about it reflects
 *     real consumption. It's refunded in full, same as the untouched room-nights are.
 *   - Checked in at some point (mid-stay cancellation): from that point on, staff may have
 *     adjusted the fee to reflect sessions actually used (see BookingService.applyAddons) -
 *     whatever value is on the booking at cancel time is trusted as the real, already-consumed
 *     amount, so none of it is refunded, same as an ordinary non-refundable bill.
 * Café orders are never refunded either way - they can only be logged once checked in at all
 * (same gate), so by construction any food order on a booking already represents something
 * actually eaten, never a pre-arrival reservation.
 *
 * A no-show is treated the same as an actual stay for the ROOM charge only - once a night's
 * date has passed, that night is used, whether or not the guest showed up. Kids Play Zone and
 * Full Board are unaffected by this: a no-show never checked in, so per the rule above those
 * fees (if any were pre-selected at checkout) are still refunded in full even though the room
 * penalty applies.
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
                                   boolean everCheckedIn, int discountPercent, BigDecimal payableTotal) {
        if (totalNights <= 0) {
            return new Result(BigDecimal.ZERO);
        }
        long elapsedNights = Math.max(0, Math.min(totalNights, ChronoUnit.DAYS.between(checkIn, today)));
        long remainingNights = totalNights - elapsedNights;

        BigDecimal roomRefund = currentRoomPerNightRate.multiply(BigDecimal.valueOf(remainingNights));
        BigDecimal addonRefund = everCheckedIn ? BigDecimal.ZERO : orZero(childcareFee).add(orZero(fullBoardFee));
        BigDecimal refundableSubtotal = roomRefund.add(addonRefund);

        BigDecimal discountMultiplier = BigDecimal.valueOf(100 - discountPercent)
                .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
        BigDecimal refundAmount = refundableSubtotal.multiply(discountMultiplier).setScale(2, RoundingMode.HALF_UP);

        BigDecimal penalty = payableTotal.subtract(refundAmount);
        penalty = penalty.max(BigDecimal.ZERO).min(payableTotal.max(BigDecimal.ZERO));
        return new Result(penalty);
    }

    private static BigDecimal orZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
