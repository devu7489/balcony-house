package com.thebalconyhouse.backend.booking;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Takes exactly one unit of a room category out of the bookable pool for [startDate,
 * endDate) - same half-open convention as Booking.checkIn/checkOut. For maintenance,
 * renovation, or the owner using a room themselves, without faking a guest booking to hide
 * it. Only actually works because BookingService.unitsLeft() subtracts overlapping blocks
 * alongside overlapping bookings - a block that didn't reduce availability would just be a
 * note, not a real hold on inventory.
 */
@Entity
@Table(name = "room_blocks")
public class RoomBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long propertyId;
    private LocalDate startDate;
    private LocalDate endDate;

    @Column(length = 500)
    private String reason;

    private Instant createdAt;

    protected RoomBlock() {}

    public RoomBlock(Long propertyId, LocalDate startDate, LocalDate endDate, String reason, Instant createdAt) {
        this.propertyId = propertyId;
        this.startDate = startDate;
        this.endDate = endDate;
        this.reason = reason;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public Long getPropertyId() { return propertyId; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
    public String getReason() { return reason; }
    public Instant getCreatedAt() { return createdAt; }
}
