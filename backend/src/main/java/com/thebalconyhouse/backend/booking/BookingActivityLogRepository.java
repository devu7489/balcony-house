package com.thebalconyhouse.backend.booking;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BookingActivityLogRepository extends JpaRepository<BookingActivityLog, Long> {
    List<BookingActivityLog> findByBookingIdOrderByOccurredAtDesc(Long bookingId);

    // A group action (e.g. cancel the whole trip) logs once per room with bookingGroupId
    // set, but a per-room action (e.g. recording payment on just one room in a trip) only
    // sets bookingId - so a trip's full history needs both matched separately, not just one.
    @Query("SELECT a FROM BookingActivityLog a WHERE a.bookingGroupId = :groupId OR a.bookingId IN :bookingIds ORDER BY a.occurredAt DESC")
    List<BookingActivityLog> findForGroup(@Param("groupId") Long groupId, @Param("bookingIds") List<Long> bookingIds);
}
