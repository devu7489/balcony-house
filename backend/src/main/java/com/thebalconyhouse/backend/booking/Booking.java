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

    // How many childcare sessions (day-slots at the Kids Play Zone, combined across every
    // enrolled child) this trip is actually billed for - the fee driver, not childrenCount
    // itself. Defaulted to `nights` at creation (assume every day), correctable by admin
    // afterward to what was actually used. Integer (not int) and nullable, same pattern as
    // paymentAttempts below - existing rows predate this column, and Hibernate 6's row
    // hydration throws rather than coercing a SQL NULL into a primitive int field (a plain
    // "int" field also fails schema migration outright: it defaults to a NOT NULL column,
    // and "ALTER TABLE ... ADD COLUMN ... NOT NULL" is rejected against a table that
    // already has rows with nothing to backfill it with). Use getChildcareSessions().
    private Integer childcareSessions;

    private BigDecimal childcareFee = BigDecimal.ZERO;

    private boolean fullBoard = false;

    // How many buffet sessions (one meal service - lunch or dinner - for the trip's whole
    // guest count) this trip is actually billed for. Defaulted to `nights * 2` at creation
    // (assume every day, both meals), correctable by admin afterward. See childcareSessions
    // for why this is Integer, not int. Use getBuffetSessions().
    private Integer buffetSessions;

    private BigDecimal fullBoardFee = BigDecimal.ZERO;

    private int discountPercent = 0;

    private BigDecimal discountAmount = BigDecimal.ZERO;

    // Running total of non-voided FoodOrder line items billed to this booking (see
    // BookingService.addFoodOrder/removeFoodOrder). Denormalized here the same way
    // childcareFee/fullBoardFee are, so getFullTotal() stays a pure formula over already-
    // loaded fields rather than needing a live join every time a total is read. Only ever
    // non-zero on the trip's addon-bearer booking - same billed-once-per-trip rule as
    // childcare/full board. Nullable (existing rows predate this column, and the Java-side
    // ZERO default only applies to newly-constructed entities, not rows Hibernate hydrates
    // from a NULL column) - use getFoodOrdersFee(), same pattern as getAmountPaid().
    private BigDecimal foodOrdersFee;

    // Set once, at cancellation time, by BookingService's cancellation-policy check - null
    // until then. Record-keeping only: there's no payment gateway to auto-charge or
    // auto-refund, so the front desk still handles the actual money movement (see the
    // negative-payment refund flow); this just records what the policy said was owed.
    private BigDecimal cancellationPenaltyAmount;

    // Computed automatically at cancel time (see BookingService.classifyCancellation) - null
    // for anything never cancelled, and for legacy rows cancelled before this field existed
    // (there's no cancelledAt timestamp to retroactively determine which bucket they'd fall
    // into). Purely descriptive; doesn't affect the refund math above.
    @Enumerated(EnumType.STRING)
    private CancellationType cancellationType;

    // Set true the first time this booking's room CATEGORY is changed via upgradeRoom() -
    // only one such change is allowed per stay (see BookingService.upgradeRoom for why).
    // A physical room NUMBER change within the same category (setRoomNumber) is unrelated
    // and unlimited. Nullable Boolean, not primitive - safe to add to an existing table
    // under ddl-auto=update; null is treated as "not yet upgraded".
    private Boolean roomUpgraded;

    // Set for a standalone (non-group) booking only - a grouped trip's order lives on
    // BookingGroup instead, since payment happens once per trip, not once per room. Null
    // until BookingService opens an order via PaymentGateway.createOrder(); paymentAttempts
    // tracks how many verifyPayment() tries have been made so far (see MockPaymentGateway -
    // attempt 1 always fails, attempt 2+ succeeds, so this needs tracking across requests).
    private String paymentOrderRef;
    private Integer paymentAttempts;

    // Set once a "complete your payment" reminder has gone out, so PaymentHoldCleanupScheduler
    // never sends it twice for the same booking - not reset by anything (there's no concept of
    // extending a hold in this app).
    private Instant paymentReminderSentAt;

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

    /** Room + childcare + full board + food orders, minus any discount - what the guest actually owes in total. */
    public BigDecimal getFullTotal() {
        return amount.add(childcareFee).add(fullBoardFee).add(getFoodOrdersFee()).subtract(discountAmount);
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
    public int getChildcareSessions() { return childcareSessions == null ? 0 : childcareSessions; }
    public BigDecimal getChildcareFee() { return childcareFee; }
    public void setChildcare(int childrenCount, int childcareSessions, BigDecimal childcareFee) {
        this.childrenCount = childrenCount;
        this.childcareSessions = childcareSessions;
        this.childcareFee = childcareFee;
    }
    public boolean isFullBoard() { return fullBoard; }
    public int getBuffetSessions() { return buffetSessions == null ? 0 : buffetSessions; }
    public BigDecimal getFullBoardFee() { return fullBoardFee; }
    public void setFullBoard(boolean fullBoard, int buffetSessions, BigDecimal fullBoardFee) {
        this.fullBoard = fullBoard;
        this.buffetSessions = buffetSessions;
        this.fullBoardFee = fullBoardFee;
    }
    public BigDecimal getFoodOrdersFee() { return foodOrdersFee != null ? foodOrdersFee : BigDecimal.ZERO; }
    public void setFoodOrdersFee(BigDecimal foodOrdersFee) { this.foodOrdersFee = foodOrdersFee; }
    public int getDiscountPercent() { return discountPercent; }
    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscount(int discountPercent, BigDecimal discountAmount) {
        this.discountPercent = discountPercent;
        this.discountAmount = discountAmount;
    }
    public BigDecimal getCancellationPenaltyAmount() { return cancellationPenaltyAmount; }
    public void setCancellationPenaltyAmount(BigDecimal cancellationPenaltyAmount) { this.cancellationPenaltyAmount = cancellationPenaltyAmount; }
    public CancellationType getCancellationType() { return cancellationType; }
    public void setCancellationType(CancellationType cancellationType) { this.cancellationType = cancellationType; }
    public boolean isRoomUpgraded() { return Boolean.TRUE.equals(roomUpgraded); }
    public void setRoomUpgraded(boolean roomUpgraded) { this.roomUpgraded = roomUpgraded; }
    public String getPaymentOrderRef() { return paymentOrderRef; }
    public void setPaymentOrderRef(String paymentOrderRef) { this.paymentOrderRef = paymentOrderRef; }
    public int getPaymentAttempts() { return paymentAttempts == null ? 0 : paymentAttempts; }
    public void setPaymentAttempts(int paymentAttempts) { this.paymentAttempts = paymentAttempts; }
    public Instant getPaymentReminderSentAt() { return paymentReminderSentAt; }
    public void setPaymentReminderSentAt(Instant paymentReminderSentAt) { this.paymentReminderSentAt = paymentReminderSentAt; }
}
