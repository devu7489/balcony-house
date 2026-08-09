package com.thebalconyhouse.backend.booking;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Housekeeping status for one physical room number - separate from RoomBlock (which takes a
 * whole room CATEGORY out of the bookable pool for a date range, e.g. for repairs). This is
 * per-unit and doesn't affect availability at all; it's purely the routine "checked out ->
 * needs cleaning -> ready" cycle. Only rows that have ever been touched exist here - a room
 * number nobody's ever set a status for is treated as CLEAN by default (see
 * AdminRooms.jsx/RoomStatusService), so this table doesn't need to be pre-populated for
 * every room number a property could ever have.
 */
@Entity
@Table(name = "room_status", uniqueConstraints = @UniqueConstraint(columnNames = {"property_id", "room_number"}))
public class RoomStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "property_id")
    private Long propertyId;

    @Column(name = "room_number")
    private String roomNumber;

    @Enumerated(EnumType.STRING)
    private HousekeepingStatus status;

    private Instant updatedAt;
    private String updatedBy;

    protected RoomStatus() {}

    public RoomStatus(Long propertyId, String roomNumber, HousekeepingStatus status, Instant updatedAt, String updatedBy) {
        this.propertyId = propertyId;
        this.roomNumber = roomNumber;
        this.status = status;
        this.updatedAt = updatedAt;
        this.updatedBy = updatedBy;
    }

    public Long getId() { return id; }
    public Long getPropertyId() { return propertyId; }
    public String getRoomNumber() { return roomNumber; }
    public HousekeepingStatus getStatus() { return status; }
    public void setStatus(HousekeepingStatus status) { this.status = status; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
}
