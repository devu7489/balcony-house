package com.thebalconyhouse.backend.booking.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record FoodOrderDto(
        Long id,
        String itemName,
        BigDecimal unitPrice,
        int quantity,
        BigDecimal lineTotal,
        Instant orderedAt
) {}
