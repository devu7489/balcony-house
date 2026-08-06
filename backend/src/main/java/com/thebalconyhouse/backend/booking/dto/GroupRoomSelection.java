package com.thebalconyhouse.backend.booking.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record GroupRoomSelection(
        @NotNull Long propertyId,
        @Min(1) int guests
) {}
