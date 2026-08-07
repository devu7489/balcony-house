package com.thebalconyhouse.backend.booking.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * Self-contained: everything the print view needs is here, including a snapshot of the
 * hotel's GST details at generation time - so a later change to app.hotel.gst.* (a rate
 * correction, say) never rewrites an invoice that's already gone out to a guest.
 * taxableValue/gstRatePercent/cgstAmount/sgstAmount/totalAmount treat the room rates the
 * guest already paid as GST-INCLUSIVE (standard for consumer-facing hotel tariffs) and back
 * out the tax portion, rather than adding GST on top of what was actually collected - see
 * InvoiceService for the reasoning.
 */
public record InvoiceDto(
        String invoiceNumber,
        Instant generatedAt,
        String hotelName,
        String hotelLegalName,
        String hotelGstin,
        String hotelAddress,
        String hotelStateName,
        String hotelHsnCode,
        String hotelContactEmail,
        String hotelContactPhone,
        boolean gstEnabled,
        String guestName,
        String guestEmail,
        String guestPhone,
        LocalDate checkIn,
        LocalDate checkOut,
        long nights,
        List<InvoiceLineDto> lines,
        BigDecimal taxableValue,
        BigDecimal gstRatePercent,
        BigDecimal cgstAmount,
        BigDecimal sgstAmount,
        BigDecimal totalAmount,
        List<PaymentRecordDto> payments
) {}
