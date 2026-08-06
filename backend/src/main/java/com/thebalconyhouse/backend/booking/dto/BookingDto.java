package com.thebalconyhouse.backend.booking.dto;

import com.thebalconyhouse.backend.booking.BookingStatus;

import java.time.LocalDate;

public record BookingDto(
        Long id,
        Long propertyId,
        String propertyName,
        String propertyHeroImageUrl,
        String guestEmail,
        String guestName,
        String guestPhone,
        LocalDate checkIn,
        LocalDate checkOut,
        int guests,
        String notes,
        BookingStatus status,
        Long bookingGroupId
) {}
