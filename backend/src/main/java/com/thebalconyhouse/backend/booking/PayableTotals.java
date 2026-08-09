package com.thebalconyhouse.backend.booking;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Batch version of the same "what does this booking actually owe" rule BookingService applies
 * one-at-a-time (see BookingService.payableTotal's own comment for the full reasoning: trip-
 * wide Kids Play Zone/Full Board fees are denormalized onto every room in a group, so only
 * the group's first room by id is treated as carrying them - everyone else owes just their
 * own room amount minus their own discount). Kept as a standalone utility, not a call into
 * BookingService, so read-only reporting (dashboard, guest directory) can compute this for a
 * whole list of bookings in one pass with no per-booking query, and so this logic - which
 * BookingService already owns and tests for the payment-critical path - isn't refactored
 * under a reporting feature that doesn't need to touch it.
 */
public final class PayableTotals {

    private PayableTotals() {}

    public static Map<Long, BigDecimal> forBookings(List<Booking> bookings) {
        Map<Long, Long> firstIdByGroup = bookings.stream()
                .filter(b -> b.getBookingGroupId() != null)
                .collect(Collectors.groupingBy(Booking::getBookingGroupId,
                        Collectors.mapping(Booking::getId, Collectors.minBy(Long::compareTo))))
                .entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, e -> e.getValue().orElseThrow()));

        return bookings.stream().collect(Collectors.toMap(Booking::getId, b -> {
            boolean isAddonBearer = b.getBookingGroupId() == null || b.getId().equals(firstIdByGroup.get(b.getBookingGroupId()));
            return isAddonBearer ? b.getFullTotal() : b.getAmount().subtract(b.getDiscountAmount());
        }));
    }
}
