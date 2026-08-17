package com.thebalconyhouse.backend.booking.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

public record DailyCollectionDto(
        LocalDate date,
        Map<String, BigDecimal> byMethod,
        BigDecimal total
) {}
