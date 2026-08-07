package com.thebalconyhouse.backend.booking;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "bookings")
public class Booking {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long propertyId;
    private String guestEmail;
    private String guestName;
    private String guestPhone;
    private LocalDate checkIn;
    private LocalDate checkOut;
    private int guests;
    private Instant createdAt;

    @Column(length = 1000)
    private String notes;

    private Long bookingGroupId;

    @Enumerated(EnumType.STRING)
    private BookingStatus status = BookingStatus.CONFIRMED;

    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    private String paymentMethod;

    @Column(length = 500)
    private String paymentReference;

    private int childrenCount = 0;

    private BigDecimal childcareFee = BigDecimal.ZERO;

    private boolean fullBoard = false;

    private BigDecimal fullBoardFee = BigDecimal.ZERO;

    private int discountPercent = 0;

    private BigDecimal discountAmount = BigDecimal.ZERO;

    protected Booking() {}

    public Booking(Long propertyId, String guestEmail, String guestName, String guestPhone,
                    LocalDate checkIn, LocalDate checkOut, int guests, String notes, Instant createdAt) {
        this.propertyId = propertyId;
        this.guestEmail = guestEmail;
        this.guestName = guestName;
        this.guestPhone = guestPhone;
        this.checkIn = checkIn;
        this.checkOut = checkOut;
        this.guests = guests;
        this.notes = notes;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public Long getPropertyId() { return propertyId; }
    public String getGuestEmail() { return guestEmail; }
    public String getGuestName() { return guestName; }
    public String getGuestPhone() { return guestPhone; }
    public LocalDate getCheckIn() { return checkIn; }
    public LocalDate getCheckOut() { return checkOut; }
    public int getGuests() { return guests; }
    public String getNotes() { return notes; }
    public Instant getCreatedAt() { return createdAt; }
    public BookingStatus getStatus() { return status; }
    public void setStatus(BookingStatus status) { this.status = status; }
    public Long getBookingGroupId() { return bookingGroupId; }
    public void setBookingGroupId(Long bookingGroupId) { this.bookingGroupId = bookingGroupId; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public String getPaymentMethod() { return paymentMethod; }
    public String getPaymentReference() { return paymentReference; }
    public void markPaid(String paymentMethod, String paymentReference) {
        this.paymentStatus = PaymentStatus.PAID;
        this.paymentMethod = paymentMethod;
        this.paymentReference = paymentReference;
    }
    public void setInitialPayment(PaymentStatus paymentStatus, String paymentMethod, String paymentReference) {
        this.paymentStatus = paymentStatus;
        this.paymentMethod = paymentMethod;
        this.paymentReference = paymentReference;
    }
    public int getChildrenCount() { return childrenCount; }
    public BigDecimal getChildcareFee() { return childcareFee; }
    public void setChildcare(int childrenCount, BigDecimal childcareFee) {
        this.childrenCount = childrenCount;
        this.childcareFee = childcareFee;
    }
    public boolean isFullBoard() { return fullBoard; }
    public BigDecimal getFullBoardFee() { return fullBoardFee; }
    public void setFullBoard(boolean fullBoard, BigDecimal fullBoardFee) {
        this.fullBoard = fullBoard;
        this.fullBoardFee = fullBoardFee;
    }
    public int getDiscountPercent() { return discountPercent; }
    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscount(int discountPercent, BigDecimal discountAmount) {
        this.discountPercent = discountPercent;
        this.discountAmount = discountAmount;
    }
}
