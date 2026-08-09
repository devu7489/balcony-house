package com.thebalconyhouse.backend.booking;

import com.thebalconyhouse.backend.booking.dto.RoomStatusDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class RoomStatusService {

    private final RoomStatusRepository repository;

    public RoomStatusService(RoomStatusRepository repository) {
        this.repository = repository;
    }

    public List<RoomStatusDto> findAll() {
        return repository.findAllByOrderByPropertyIdAscRoomNumberAsc().stream().map(this::toDto).toList();
    }

    @Transactional
    public RoomStatusDto setStatus(Long propertyId, String roomNumber, HousekeepingStatus status, String updatedBy) {
        RoomStatus row = repository.findByPropertyIdAndRoomNumber(propertyId, roomNumber)
                .orElseGet(() -> new RoomStatus(propertyId, roomNumber, status, Instant.now(), updatedBy));
        row.setStatus(status);
        row.setUpdatedAt(Instant.now());
        row.setUpdatedBy(updatedBy);
        return toDto(repository.save(row));
    }

    /** Called right after a checkout - a room a guest just left always needs cleaning. */
    @Transactional
    public void markDirty(Long propertyId, String roomNumber, String updatedBy) {
        if (roomNumber == null || roomNumber.isBlank()) return;
        setStatus(propertyId, roomNumber, HousekeepingStatus.DIRTY, updatedBy);
    }

    private RoomStatusDto toDto(RoomStatus r) {
        return new RoomStatusDto(r.getPropertyId(), r.getRoomNumber(), r.getStatus(), r.getUpdatedAt(), r.getUpdatedBy());
    }
}
