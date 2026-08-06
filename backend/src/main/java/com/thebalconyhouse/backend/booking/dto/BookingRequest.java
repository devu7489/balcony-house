package com.thebalconyhouse.backend.booking.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record BookingRequest(
        @NotNull Long propertyId,
        @NotNull @Future LocalDate checkIn,
        @NotNull @Future LocalDate checkOut,
        @Min(1) int guests
) {}
