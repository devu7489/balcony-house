package com.thebalconyhouse.backend.addon;

import com.thebalconyhouse.backend.property.Property;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Computes a room's actual per-night rate from its DB-stored base price
 * (Property.pricePerNight, the <=5-night off-peak rate) plus the shared,
 * YAML-configurable stay-length discount and peak-season surcharge - see
 * app.pricing.room.* in application.yml.
 */
@Component
public class RoomPricing {

    private final BigDecimal midStayRatio;
    private final BigDecimal longStayRatio;
    private final BigDecimal peakSeasonMultiplier;
    private final Set<Integer> peakSeasonMonths;

    public RoomPricing(
            @Value("${app.pricing.room.mid-stay-ratio}") BigDecimal midStayRatio,
            @Value("${app.pricing.room.long-stay-ratio}") BigDecimal longStayRatio,
            @Value("${app.pricing.room.peak-season-multiplier}") BigDecimal peakSeasonMultiplier,
            @Value("${app.pricing.room.peak-season-months}") String peakSeasonMonths) {
        this.midStayRatio = midStayRatio;
        this.longStayRatio = longStayRatio;
        this.peakSeasonMultiplier = peakSeasonMultiplier;
        this.peakSeasonMonths = Arrays.stream(peakSeasonMonths.split(","))
                .map(String::trim)
                .map(Integer::parseInt)
                .collect(Collectors.toSet());
    }

    /** Per-night rate for a stay of this length starting on checkIn. */
    public BigDecimal priceForStay(Property property, LocalDate checkIn, long nights) {
        BigDecimal tierRate = tierRate(property.getPricePerNight(), nights);
        BigDecimal rate = isPeakSeason(checkIn) ? tierRate.multiply(peakSeasonMultiplier) : tierRate;
        return rate.setScale(2, RoundingMode.HALF_UP);
    }

    public boolean isPeakSeason(LocalDate checkIn) {
        return peakSeasonMonths.contains(checkIn.getMonthValue());
    }

    private BigDecimal tierRate(BigDecimal baseRate, long nights) {
        if (nights <= 5) return baseRate;
        if (nights <= 10) return baseRate.multiply(midStayRatio);
        return baseRate.multiply(longStayRatio);
    }
}
