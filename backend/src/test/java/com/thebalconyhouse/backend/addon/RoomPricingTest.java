package com.thebalconyhouse.backend.addon;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RoomPricingTest {

    @Test
    void preCheckInUpgrade_usesNewRateForAllNights() {
        // Nothing elapsed yet - a plain "upgrade before arrival" should just be
        // newRate x totalNights, same as booking the new room from scratch.
        BigDecimal result = RoomPricing.proratedAmount(
                new BigDecimal("21000.00"), 7, 0, new BigDecimal("4000.00"));
        assertEquals(new BigDecimal("28000.00"), result);
    }

    @Test
    void midStayChange_splitsBetweenOldAndNewRate() {
        // 7-night stay at Sunrise (₹3000/night = ₹21000 total), guest moves to Mist
        // Cottage (₹4000/night) after 3 nights: 3 nights already billed at the old
        // room's effective rate, 4 remaining nights at the new room's rate.
        BigDecimal result = RoomPricing.proratedAmount(
                new BigDecimal("21000.00"), 7, 3, new BigDecimal("4000.00"));
        // 3 * 3000 + 4 * 4000 = 9000 + 16000 = 25000
        assertEquals(new BigDecimal("25000.00"), result);
    }

    @Test
    void changeOnLastNight_billsAlmostEntirelyAtOldRate() {
        BigDecimal result = RoomPricing.proratedAmount(
                new BigDecimal("21000.00"), 7, 6, new BigDecimal("4000.00"));
        // 6 * 3000 + 1 * 4000 = 18000 + 4000 = 22000
        assertEquals(new BigDecimal("22000.00"), result);
    }

    @Test
    void elapsedNightsAreClampedToTotalNights() {
        // Defensive: a stale/late call after the whole stay has technically elapsed
        // shouldn't ever charge the new room for negative remaining nights.
        BigDecimal result = RoomPricing.proratedAmount(
                new BigDecimal("21000.00"), 7, 10, new BigDecimal("4000.00"));
        assertEquals(new BigDecimal("21000.00"), result);
    }

    @Test
    void negativeElapsedNightsAreClampedToZero() {
        // A change made well before check-in (today is before the stay even starts)
        // must not go negative and must behave like the pre-check-in case.
        BigDecimal result = RoomPricing.proratedAmount(
                new BigDecimal("21000.00"), 7, -5, new BigDecimal("4000.00"));
        assertEquals(new BigDecimal("28000.00"), result);
    }
}
