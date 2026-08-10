package com.thebalconyhouse.backend.booking.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record AdminBookingGroupRequest(
        @NotBlank String guestName,
        @NotBlank String guestPhone,
        String guestEmail,
        @NotNull @FutureOrPresent LocalDate checkIn,
        @NotNull @FutureOrPresent LocalDate checkOut,
        String notes,
        @NotEmpty List<@Valid GroupRoomSelection> rooms,
        // Real cap is 2 kids per room in the request, enforced dynamically in BookingService
        // (annotations need a compile-time literal, so this is just a generous outer bound).
        @Min(0) @Max(24) int childrenCount,
        boolean fullBoard,
        boolean paymentReceived,
        String paymentMethod,
        String paymentReference,
        @Min(0) @Max(20) int discountPercent
) {}
