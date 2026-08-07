package com.thebalconyhouse.backend.addon;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Splits a GST-INCLUSIVE total (what the guest actually paid - room tariffs shown to guests
 * throughout this app have never had tax added on top of them) back into taxable value +
 * CGST + SGST, rather than adding tax on top of an already-collected amount. That's the only
 * split consistent with what this app has ever actually charged and recorded as paid - see
 * InvoiceService for where this is used. IGST doesn't apply here: place of supply for hotel
 * accommodation is always the property's own state (Section 12(3), IGST Act), so it's always
 * an intra-state supply from the hotel's perspective, split evenly as CGST + SGST.
 */
public final class GstSplit {

    private GstSplit() {}

    public record Result(BigDecimal taxableValue, BigDecimal cgst, BigDecimal sgst) {
        public BigDecimal totalGst() { return cgst.add(sgst); }
    }

    public static Result of(BigDecimal totalInclusive, BigDecimal ratePercent) {
        if (ratePercent == null || ratePercent.signum() <= 0) {
            return new Result(totalInclusive.setScale(2, RoundingMode.HALF_UP), BigDecimal.ZERO, BigDecimal.ZERO);
        }
        BigDecimal divisor = BigDecimal.ONE.add(ratePercent.divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP));
        BigDecimal taxableValue = totalInclusive.divide(divisor, 2, RoundingMode.HALF_UP);
        BigDecimal totalGst = totalInclusive.subtract(taxableValue);
        BigDecimal cgst = totalGst.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
        BigDecimal sgst = totalGst.subtract(cgst);
        return new Result(taxableValue, cgst, sgst);
    }
}
