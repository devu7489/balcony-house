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

    // Free-text physical room label (e.g. "S-2") staff assign at/around check-in for their
    // own tracking - deliberately not a first-class RoomUnit entity with its own availability
    // engine, since availability is still computed per room *category* (Property.totalUnits),
    // not per physical unit. Nullable, no default, purely informational.
    private String roomNumber;

    @Enumerated(EnumType.STRING)
    private BookingStatus status = BookingStatus.CONFIRMED;

    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    private String paymentMethod;

    @Column(length = 500)
    private String paymentReference;

    // How much has actually been collected so far, as of the last time payment was
    // recorded. Kept separate from `amount` (the current total owed) and deliberately
    // NOT reset when a room change moves paymentStatus back to PENDING, so the front
    // desk can always see "already paid X, balance due Y" instead of that history
    // disappearing. Nullable (existing rows predate this column) - use getAmountPaid().
    private BigDecimal amountPaid;

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
    public void setPropertyId(Long propertyId) { this.propertyId = propertyId; }
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
    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public String getPaymentMethod() { return paymentMethod; }
    public String getPaymentReference() { return paymentReference; }
    public BigDecimal getAmountPaid() { return amountPaid != null ? amountPaid : BigDecimal.ZERO; }

    /** Room + childcare + full board, minus any discount - what the guest actually owes in total. */
    public BigDecimal getFullTotal() {
        return amount.add(childcareFee).add(fullBoardFee).subtract(discountAmount);
    }

    /**
     * Sets the raw status/method/reference fields only - does NOT touch amountPaid or
     * create a Payment record. Used for the initial CONFIRMED/PENDING state at booking
     * creation; BookingService.recordPaymentInternal is the only place that actually
     * records money received (creates the itemized Payment row this all now depends on).
     */
    public void setInitialPayment(PaymentStatus paymentStatus, String paymentMethod, String paymentReference) {
        this.paymentStatus = paymentStatus;
        this.paymentMethod = paymentMethod;
        this.paymentReference = paymentReference;
    }
    /** Flips payment status without touching amountPaid/method/reference - used when a room
     *  change invalidates a PAID mark, so the previously collected amount stays visible. */
    public void setPaymentStatus(PaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
    }
    public void setAmountPaid(BigDecimal amountPaid) { this.amountPaid = amountPaid; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }
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
