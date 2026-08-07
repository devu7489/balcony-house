package com.thebalconyhouse.backend.booking.dto;

import com.thebalconyhouse.backend.booking.BookingStatus;
import com.thebalconyhouse.backend.booking.PaymentStatus;

import java.math.BigDecimal;
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
        Long bookingGroupId,
        BigDecimal amount,
        PaymentStatus paymentStatus,
        String paymentMethod,
        String paymentReference,
        int childrenCount,
        BigDecimal childcareFee
) {}
