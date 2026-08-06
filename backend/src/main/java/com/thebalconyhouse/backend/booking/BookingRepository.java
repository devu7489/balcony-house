package com.thebalconyhouse.backend.booking;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByGuestEmail(String guestEmail);
    List<Booking> findAllByOrderByCheckInDesc();

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.propertyId = :propertyId AND b.status = 'CONFIRMED' " +
           "AND b.checkIn < :checkOut AND b.checkOut > :checkIn")
    long countOverlapping(@Param("propertyId") Long propertyId, @Param("checkIn") LocalDate checkIn, @Param("checkOut") LocalDate checkOut);
}
