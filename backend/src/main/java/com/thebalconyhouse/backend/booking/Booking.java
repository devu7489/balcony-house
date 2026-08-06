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
    private LocalDate checkIn;
    private LocalDate checkOut;
    private int guests;
    private Instant createdAt;

    protected Booking() {}
    public Booking(Long propertyId, String guestEmail, LocalDate checkIn, LocalDate checkOut, int guests, Instant createdAt) {
        this.propertyId = propertyId; this.guestEmail = guestEmail;
        this.checkIn = checkIn; this.checkOut = checkOut; this.guests = guests; this.createdAt = createdAt;
    }
    public Long getId() { return id; }
    public Long getPropertyId() { return propertyId; }
    public String getGuestEmail() { return guestEmail; }
    public LocalDate getCheckIn() { return checkIn; }
    public LocalDate getCheckOut() { return checkOut; }
    public int getGuests() { return guests; }
}
