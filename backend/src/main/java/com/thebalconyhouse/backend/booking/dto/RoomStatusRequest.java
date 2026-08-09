package com.thebalconyhouse.backend.booking.dto;

import com.thebalconyhouse.backend.booking.HousekeepingStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RoomStatusRequest(@NotNull Long propertyId, @NotBlank String roomNumber, @NotNull HousekeepingStatus status) {}
