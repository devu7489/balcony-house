package com.thebalconyhouse.backend.addon;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class FullBoardPricing {

    private final BigDecimal pricePerPersonPerDay;

    public FullBoardPricing(@Value("${app.pricing.full-board.price-per-person-per-day}") BigDecimal pricePerPersonPerDay) {
        this.pricePerPersonPerDay = pricePerPersonPerDay;
    }

    public BigDecimal getPricePerPersonPerDay() {
        return pricePerPersonPerDay;
    }
}
