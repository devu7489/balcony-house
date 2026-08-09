package com.thebalconyhouse.backend.booking;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Who did what to a booking - separate from the login-only audit/AuditLog (LOGIN_SUCCESS/
 * FAILURE/LOGOUT). Written from AdminBookingController right after each mutating action
 * succeeds, since that's the one place that already has both the authenticated admin's
 * email and the result of the action - BookingService itself doesn't need to know who's
 * calling it, so its method signatures are left alone.
 */
@Entity
@Table(name = "booking_activity_log")
public class BookingActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long bookingId;
    private Long bookingGroupId;

    @Column(nullable = false)
    private String action;

    @Column(nullable = false)
    private String performedBy;

    @Column(length = 500)
    private String details;

    private Instant occurredAt;

    protected BookingActivityLog() {}

    public BookingActivityLog(Long bookingId, Long bookingGroupId, String action, String performedBy,
                               String details, Instant occurredAt) {
        this.bookingId = bookingId;
        this.bookingGroupId = bookingGroupId;
        this.action = action;
        this.performedBy = performedBy;
        this.details = details;
        this.occurredAt = occurredAt;
    }

    public Long getId() { return id; }
    public Long getBookingId() { return bookingId; }
    public Long getBookingGroupId() { return bookingGroupId; }
    public String getAction() { return action; }
    public String getPerformedBy() { return performedBy; }
    public String getDetails() { return details; }
    public Instant getOccurredAt() { return occurredAt; }
}
