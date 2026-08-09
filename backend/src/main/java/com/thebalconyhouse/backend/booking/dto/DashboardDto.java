package com.thebalconyhouse.backend.booking.dto;

import java.math.BigDecimal;

public record DashboardDto(
        int totalUnits,
        int occupiedUnitsToday,
        double occupancyPercent,
        BigDecimal revenueThisMonth,
        BigDecimal outstandingBalance,
        long pendingPaymentsCount,
        long arrivalsToday,
        long departuresToday,
        long arrivalsNext7Days
) {}
