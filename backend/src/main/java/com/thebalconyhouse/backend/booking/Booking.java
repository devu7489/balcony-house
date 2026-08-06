package com.thebalconyhouse.backend.booking;

import jakarta.persistence.*;
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

    @Enumerated(EnumType.STRING)
    private BookingStatus status = BookingStatus.CONFIRMED;

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
}
