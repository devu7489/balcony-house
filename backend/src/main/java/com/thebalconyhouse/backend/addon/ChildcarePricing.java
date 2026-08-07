package com.thebalconyhouse.backend.addon;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class ChildcarePricing {

    // Max free kids (under 12) per room. Not YAML-configurable: Bean Validation's @Max
    // needs a compile-time literal (see AdminBookingRequest.childrenCount, which books a
    // single room so this cap applies directly; BookingGroupRequest.childrenCount can cover
    // multiple rooms, so BookingService multiplies this by the room count instead).
    public static final int MAX_CHILDREN_PER_ROOM = 2;

    private final BigDecimal shortStayRate;
    private final BigDecimal midStayRate;
    private final BigDecimal longStayRate;

    public ChildcarePricing(
            @Value("${app.pricing.childcare.short-stay-rate}") BigDecimal shortStayRate,
            @Value("${app.pricing.childcare.mid-stay-rate}") BigDecimal midStayRate,
            @Value("${app.pricing.childcare.long-stay-rate}") BigDecimal longStayRate) {
        this.shortStayRate = shortStayRate;
        this.midStayRate = midStayRate;
        this.longStayRate = longStayRate;
    }

    /** Per-day rate for one child, tiered by total stay length. */
    public BigDecimal perDayRate(long nights) {
        if (nights <= 5) return shortStayRate;
        if (nights <= 10) return midStayRate;
        return longStayRate;
    }

    /** Flat total for one child across the whole stay - the per-day rate times every night. */
    public BigDecimal totalPerChild(long nights) {
        return perDayRate(nights).multiply(BigDecimal.valueOf(nights));
    }
}
