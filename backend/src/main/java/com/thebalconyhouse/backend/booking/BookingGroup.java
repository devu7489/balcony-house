package com.thebalconyhouse.backend.booking;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "booking_groups")
public class BookingGroup {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String guestEmail;
    private String guestName;
    private String guestPhone;
    private LocalDate checkIn;
    private LocalDate checkOut;

    @Column(length = 1000)
    private String notes;

    private Instant createdAt;

    // A trip pays once for the whole group, not once per room - see BookingService.createGroup.
    // Null until BookingService opens an order via PaymentGateway.createOrder(); paymentAttempts
    // tracks how many verifyPayment() tries have been made (MockPaymentGateway fails attempt 1,
    // succeeds attempt 2+, so this needs to persist across the initial attempt and any retry).
    private String paymentOrderRef;
    private Integer paymentAttempts;

    protected BookingGroup() {}

    public BookingGroup(String guestEmail, String guestName, String guestPhone,
                         LocalDate checkIn, LocalDate checkOut, String notes, Instant createdAt) {
        this.guestEmail = guestEmail;
        this.guestName = guestName;
        this.guestPhone = guestPhone;
        this.checkIn = checkIn;
        this.checkOut = checkOut;
        this.notes = notes;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public String getGuestEmail() { return guestEmail; }
    public String getGuestName() { return guestName; }
    public String getGuestPhone() { return guestPhone; }
    public LocalDate getCheckIn() { return checkIn; }
    public LocalDate getCheckOut() { return checkOut; }
    public String getNotes() { return notes; }
    public Instant getCreatedAt() { return createdAt; }
    public String getPaymentOrderRef() { return paymentOrderRef; }
    public void setPaymentOrderRef(String paymentOrderRef) { this.paymentOrderRef = paymentOrderRef; }
    public int getPaymentAttempts() { return paymentAttempts == null ? 0 : paymentAttempts; }
    public void setPaymentAttempts(int paymentAttempts) { this.paymentAttempts = paymentAttempts; }
}
