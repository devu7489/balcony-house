package com.thebalconyhouse.backend.booking;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * One row per generated invoice, keyed to either a trip (bookingGroupId) or a single
 * standalone booking (bookingId) - exactly one of the two is set. Generation is idempotent
 * (see InvoiceService.getOrCreate): re-opening the same booking's invoice returns this same
 * row rather than minting a new number or recomputing figures against whatever the GST rate
 * or booking data happen to be today. That snapshot behaviour is the whole point - a real
 * invoice must not silently change after the fact just because the config or the booking
 * changed later.
 */
@Entity
@Table(name = "invoices")
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String invoiceNumber;

    private Long bookingGroupId;

    private Long bookingId;

    private String guestName;

    private String guestEmail;

    private BigDecimal taxableValue;

    private BigDecimal gstRatePercent;

    private BigDecimal cgstAmount;

    private BigDecimal sgstAmount;

    private BigDecimal totalAmount;

    private Instant generatedAt;

    protected Invoice() {}

    public Invoice(String invoiceNumber, Long bookingGroupId, Long bookingId, String guestName, String guestEmail,
                    BigDecimal taxableValue, BigDecimal gstRatePercent, BigDecimal cgstAmount, BigDecimal sgstAmount,
                    BigDecimal totalAmount, Instant generatedAt) {
        this.invoiceNumber = invoiceNumber;
        this.bookingGroupId = bookingGroupId;
        this.bookingId = bookingId;
        this.guestName = guestName;
        this.guestEmail = guestEmail;
        this.taxableValue = taxableValue;
        this.gstRatePercent = gstRatePercent;
        this.cgstAmount = cgstAmount;
        this.sgstAmount = sgstAmount;
        this.totalAmount = totalAmount;
        this.generatedAt = generatedAt;
    }

    public Long getId() { return id; }
    public String getInvoiceNumber() { return invoiceNumber; }
    public Long getBookingGroupId() { return bookingGroupId; }
    public Long getBookingId() { return bookingId; }
    public String getGuestName() { return guestName; }
    public String getGuestEmail() { return guestEmail; }
    public BigDecimal getTaxableValue() { return taxableValue; }
    public BigDecimal getGstRatePercent() { return gstRatePercent; }
    public BigDecimal getCgstAmount() { return cgstAmount; }
    public BigDecimal getSgstAmount() { return sgstAmount; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public Instant getGeneratedAt() { return generatedAt; }
}
