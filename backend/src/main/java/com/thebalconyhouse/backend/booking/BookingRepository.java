package com.thebalconyhouse.backend.booking;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    // Ordered by createdAt (when the booking was made), not stay dates - "booking time" is
    // the default sort for both the guest's own list and the admin dashboard; check-in-date
    // sort is offered as an explicit option in the UI, applied client-side.
    List<Booking> findByGuestEmailOrderByCreatedAtDesc(String guestEmail);
    List<Booking> findAllByOrderByCreatedAtDesc();

    // Explicit id order so a trip's room list never visibly reshuffles just because one of
    // its rooms got updated (Postgres doesn't guarantee row order across re-fetches without
    // an ORDER BY, and MVCC can change a row's physical position on UPDATE).
    List<Booking> findByBookingGroupIdOrderByIdAsc(Long bookingGroupId);

    // Plain findByCheckInAndStatus/findByCheckOutAndStatus derived-query names don't parse:
    // Spring Data reads the "In" in "checkIn" as the IN operator keyword, not part of the
    // property name, so these need to be spelled out as JPQL instead.
    @Query("SELECT b FROM Booking b WHERE b.checkIn = :date AND b.status = :status")
    List<Booking> findArrivals(@Param("date") LocalDate date, @Param("status") BookingStatus status);

    @Query("SELECT b FROM Booking b WHERE b.checkOut = :date AND b.status = :status")
    List<Booking> findDepartures(@Param("date") LocalDate date, @Param("status") BookingStatus status);

    // status IN ('CONFIRMED','CHECKED_IN') - a checked-in stay still occupies the room for
    // its remaining nights just as much as a confirmed-but-not-yet-arrived one does. This
    // used to check CONFIRMED only, which meant a room stopped blocking new bookings for its
    // own dates the moment a guest actually checked into it - a real overbooking risk.
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.propertyId = :propertyId AND b.status IN ('CONFIRMED', 'CHECKED_IN') " +
           "AND b.checkIn < :checkOut AND b.checkOut > :checkIn")
    long countOverlapping(@Param("propertyId") Long propertyId, @Param("checkIn") LocalDate checkIn, @Param("checkOut") LocalDate checkOut);

    @Query("SELECT b FROM Booking b WHERE b.status IN ('CONFIRMED', 'CHECKED_IN') AND b.checkIn < :end AND b.checkOut > :start")
    List<Booking> findActiveOverlapping(@Param("start") LocalDate start, @Param("end") LocalDate end);

    // Used to stop the same physical room number being handed to two guests whose stays
    // overlap - active meaning CONFIRMED or CHECKED_IN (a checked-out or cancelled stay
    // isn't occupying anything, so its old number is free to reuse).
    @Query("SELECT b FROM Booking b WHERE b.roomNumber = :roomNumber AND b.id <> :excludeId " +
           "AND b.status IN ('CONFIRMED', 'CHECKED_IN') AND b.checkIn < :checkOut AND b.checkOut > :checkIn")
    List<Booking> findConflictingRoomNumber(@Param("roomNumber") String roomNumber, @Param("excludeId") Long excludeId,
                                             @Param("checkIn") LocalDate checkIn, @Param("checkOut") LocalDate checkOut);

    // Held rooms nobody ever paid for. The amountPaid check matters: a room change
    // (BookingService.upgradeRoom) also resets paymentStatus to PENDING for a booking that
    // may already have real money collected against it under the old room - that's "balance
    // due", not an abandoned checkout, and must never be swept up here even if it sits
    // PENDING past the hold window.
    @Query("SELECT b FROM Booking b WHERE b.status = 'CONFIRMED' AND b.paymentStatus = 'PENDING' " +
           "AND (b.amountPaid IS NULL OR b.amountPaid = 0) AND b.createdAt < :cutoff")
    List<Booking> findExpiredHolds(@Param("cutoff") Instant cutoff);

    // Same held-and-unpaid population as findExpiredHolds, but the earlier reminderCutoff and
    // "not already reminded" guard mean this fires once, well before the booking is actually
    // at risk of being cancelled - see PaymentHoldCleanupScheduler.
    @Query("SELECT b FROM Booking b WHERE b.status = 'CONFIRMED' AND b.paymentStatus = 'PENDING' " +
           "AND (b.amountPaid IS NULL OR b.amountPaid = 0) AND b.paymentReminderSentAt IS NULL " +
           "AND b.createdAt < :reminderCutoff")
    List<Booking> findDueForPaymentReminder(@Param("reminderCutoff") Instant reminderCutoff);
}
