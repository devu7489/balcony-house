package com.thebalconyhouse.backend.booking.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record BookingGroupRequest(
        @NotBlank String guestPhone,
        @NotNull @Future LocalDate checkIn,
        @NotNull @Future LocalDate checkOut,
        String notes,
        @NotEmpty List<@Valid GroupRoomSelection> rooms,
        @Min(0) @Max(2) int childrenCount
) {}
