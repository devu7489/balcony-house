package com.thebalconyhouse.backend.booking.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record AdminBookingRequest(
        @NotNull Long propertyId,
        @NotBlank String guestName,
        @NotBlank String guestPhone,
        String guestEmail,
        @NotNull @Future LocalDate checkIn,
        @NotNull @Future LocalDate checkOut,
        @Min(1) int guests,
        String notes,
        boolean paymentReceived,
        String paymentMethod,
        String paymentReference,
        @Min(0) @Max(2) int childrenCount
) {}
