package com.thebalconyhouse.backend.booking;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.propertyId = :propertyId AND b.status = 'CONFIRMED' " +
           "AND b.checkIn < :checkOut AND b.checkOut > :checkIn")
    long countOverlapping(@Param("propertyId") Long propertyId, @Param("checkIn") LocalDate checkIn, @Param("checkOut") LocalDate checkOut);

    // Used to stop the same physical room number being handed to two guests whose stays
    // overlap - active meaning CONFIRMED or CHECKED_IN (a checked-out or cancelled stay
    // isn't occupying anything, so its old number is free to reuse).
    @Query("SELECT b FROM Booking b WHERE b.roomNumber = :roomNumber AND b.id <> :excludeId " +
           "AND b.status IN ('CONFIRMED', 'CHECKED_IN') AND b.checkIn < :checkOut AND b.checkOut > :checkIn")
    List<Booking> findConflictingRoomNumber(@Param("roomNumber") String roomNumber, @Param("excludeId") Long excludeId,
                                             @Param("checkIn") LocalDate checkIn, @Param("checkOut") LocalDate checkOut);
}
