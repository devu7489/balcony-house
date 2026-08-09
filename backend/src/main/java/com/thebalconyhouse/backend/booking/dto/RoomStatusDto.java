package com.thebalconyhouse.backend.booking.dto;

import com.thebalconyhouse.backend.booking.HousekeepingStatus;
import java.time.Instant;

public record RoomStatusDto(Long propertyId, String roomNumber, HousekeepingStatus status, Instant updatedAt, String updatedBy) {}
