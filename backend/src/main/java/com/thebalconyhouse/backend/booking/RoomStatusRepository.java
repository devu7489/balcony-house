package com.thebalconyhouse.backend.booking;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoomStatusRepository extends JpaRepository<RoomStatus, Long> {
    List<RoomStatus> findAllByOrderByPropertyIdAscRoomNumberAsc();
    Optional<RoomStatus> findByPropertyIdAndRoomNumber(Long propertyId, String roomNumber);
}
