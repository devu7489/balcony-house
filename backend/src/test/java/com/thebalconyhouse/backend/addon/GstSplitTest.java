package com.thebalconyhouse.backend.addon;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GstSplitTest {

    @Test
    void splitsInclusiveTotal_at12Percent() {
        // Real case from this session: trip totalling Rs.29,100 already collected, 12% GST.
        // 29100 / 1.12 = 25982.142857... -> 25982.14 taxable, tax = 3117.86, split evenly.
        GstSplit.Result r = GstSplit.of(new BigDecimal("29100.00"), new BigDecimal("12"));
        assertEquals(new BigDecimal("25982.14"), r.taxableValue());
        assertEquals(new BigDecimal("1558.93"), r.cgst());
        assertEquals(new BigDecimal("1558.93"), r.sgst());
        // The split must always add back up to exactly what was collected - no leftover
        // paisa lost or invented by rounding.
        assertEquals(new BigDecimal("29100.00"), r.taxableValue().add(r.cgst()).add(r.sgst()));
    }

    @Test
    void oddTotalGst_remainderGoesToSgst_stillReconciles() {
        // A total whose tax split isn't evenly divisible by 2 to the paisa - cgst absorbs
        // the rounding, sgst gets the remainder, and the three parts still sum to the exact
        // amount originally collected (no paisa lost or invented by rounding).
        GstSplit.Result r = GstSplit.of(new BigDecimal("1001.00"), new BigDecimal("18"));
        assertEquals(new BigDecimal("848.31"), r.taxableValue());
        assertEquals(new BigDecimal("76.35"), r.cgst());
        assertEquals(new BigDecimal("76.34"), r.sgst());
        assertEquals(new BigDecimal("1001.00"), r.taxableValue().add(r.cgst()).add(r.sgst()));
    }

    @Test
    void zeroRate_returnsWholeAmountAsTaxable_noTax() {
        GstSplit.Result r = GstSplit.of(new BigDecimal("5000.00"), BigDecimal.ZERO);
        assertEquals(new BigDecimal("5000.00"), r.taxableValue());
        assertEquals(BigDecimal.ZERO, r.cgst());
        assertEquals(BigDecimal.ZERO, r.sgst());
    }

    @Test
    void nullRate_treatedAsNoGst() {
        GstSplit.Result r = GstSplit.of(new BigDecimal("5000.00"), null);
        assertEquals(new BigDecimal("5000.00"), r.taxableValue());
        assertEquals(BigDecimal.ZERO, r.cgst());
        assertEquals(BigDecimal.ZERO, r.sgst());
    }

    @Test
    void fivePercent_matchesCurrentLowTariffSlab() {
        // Sept-2025 GST reform: <=Rs.7,500/night tariff -> 5% without ITC. A single room at
        // Rs.3,000/night for 3 nights, GST-inclusive, should back out to a clean split.
        GstSplit.Result r = GstSplit.of(new BigDecimal("9000.00"), new BigDecimal("5"));
        assertEquals(new BigDecimal("8571.43"), r.taxableValue());
        assertEquals(new BigDecimal("214.29"), r.cgst());
        assertEquals(new BigDecimal("214.28"), r.sgst());
        assertEquals(new BigDecimal("9000.00"), r.taxableValue().add(r.cgst()).add(r.sgst()));
    }
}
