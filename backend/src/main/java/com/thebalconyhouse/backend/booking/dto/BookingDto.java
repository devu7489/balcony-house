package com.thebalconyhouse.backend.booking.dto;

import com.thebalconyhouse.backend.booking.BookingStatus;
import com.thebalconyhouse.backend.booking.PaymentStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * payableTotal is what THIS booking is actually responsible for collecting - not simply
 * amount + childcareFee + fullBoardFee - discountAmount. Childcare/Full Board fees are
 * trip-wide totals denormalized onto every room in a multi-room trip (see Booking.java),
 * so only the trip's first room (by id) carries them here; every other room's payableTotal
 * is just its own amount minus its own discount. Always use this field (not childcareFee/
 * fullBoardFee/amount added up client-side) to show or compare against what's owed.
 */
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
        Instant createdAt,
        String roomNumber,
        BigDecimal amount,
        PaymentStatus paymentStatus,
        String paymentMethod,
        String paymentReference,
        BigDecimal amountPaid,
        List<PaymentRecordDto> payments,
        int childrenCount,
        BigDecimal childcareFee,
        boolean fullBoard,
        BigDecimal fullBoardFee,
        int discountPercent,
        BigDecimal discountAmount,
        BigDecimal payableTotal
) {}
