package com.thebalconyhouse.backend.booking;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

// One row per payment event against a booking, so a guest who pays in two installments
// (e.g. an initial payment, then a top-up after a room change) shows up as two distinct,
// itemized entries - not one payment record silently overwritten by the next, which is
// exactly what an invoice needs to list correctly.
@Entity
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long bookingId;

    private BigDecimal amount;

    private String method;

    @Column(length = 500)
    private String reference;

    private Instant paidAt;

    protected Payment() {}

    public Payment(Long bookingId, BigDecimal amount, String method, String reference, Instant paidAt) {
        this.bookingId = bookingId;
        this.amount = amount;
        this.method = method;
        this.reference = reference;
        this.paidAt = paidAt;
    }

    public Long getId() { return id; }
    public Long getBookingId() { return bookingId; }
    public BigDecimal getAmount() { return amount; }
    public String getMethod() { return method; }
    public String getReference() { return reference; }
    public Instant getPaidAt() { return paidAt; }
}
