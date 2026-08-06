package com.thebalconyhouse.backend.booking.dto;

import java.time.LocalDate;

public record BookingDto(Long id, Long propertyId, LocalDate checkIn, LocalDate checkOut, int guests) {}
