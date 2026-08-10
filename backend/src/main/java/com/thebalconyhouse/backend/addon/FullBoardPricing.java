package com.thebalconyhouse.backend.addon;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class FullBoardPricing {

    private final BigDecimal pricePerSession;

    public FullBoardPricing(@Value("${app.pricing.full-board.price-per-session}") BigDecimal pricePerSession) {
        this.pricePerSession = pricePerSession;
    }

    /** One meal service (lunch or dinner) for the trip's whole guest count. */
    public BigDecimal getPricePerSession() {
        return pricePerSession;
    }

    /** Derived convenience for the guest-facing checkout estimate, which assumes every day,
     *  both meals (2 sessions/day) - kept so Checkout.jsx's flat preview never needs to know
     *  about sessions at all. */
    public BigDecimal getPricePerPersonPerDay() {
        return pricePerSession.multiply(BigDecimal.valueOf(2));
    }
}
