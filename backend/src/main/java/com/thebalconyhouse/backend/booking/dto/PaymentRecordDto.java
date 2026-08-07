package com.thebalconyhouse.backend.booking.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record PaymentRecordDto(
        Long id,
        Long bookingId,
        BigDecimal amount,
        String method,
        String reference,
        Instant paidAt
) {}
