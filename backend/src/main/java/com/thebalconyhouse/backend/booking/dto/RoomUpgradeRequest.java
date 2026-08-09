package com.thebalconyhouse.backend.booking.dto;

import jakarta.validation.constraints.NotNull;

public record RoomUpgradeRequest(@NotNull Long newPropertyId) {}
