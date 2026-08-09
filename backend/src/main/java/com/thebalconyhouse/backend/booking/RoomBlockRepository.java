package com.thebalconyhouse.backend.booking;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface RoomBlockRepository extends JpaRepository<RoomBlock, Long> {
    List<RoomBlock> findAllByOrderByStartDateAsc();

    @Query("SELECT COUNT(r) FROM RoomBlock r WHERE r.propertyId = :propertyId " +
           "AND r.startDate < :endDate AND r.endDate > :startDate")
    long countOverlapping(@Param("propertyId") Long propertyId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT r FROM RoomBlock r WHERE r.startDate < :end AND r.endDate > :start")
    List<RoomBlock> findActiveOverlapping(@Param("start") LocalDate start, @Param("end") LocalDate end);
}
