package com.thebalconyhouse.backend.testimonial;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Two sources feed this table: staff typing in a quote from a guest (email, review site, in
 * person - bookingId stays null for these), and a guest submitting their own review for a
 * booking they actually completed (bookingId set - see TestimonialService.submitForBooking,
 * which is the spam guard in place of a moderation queue: only the owner of a CHECKED_OUT
 * booking can submit, and only once). Either way every new row lands with featured=false until
 * an admin promotes it, so featured doubles as the moderation gate - see setFeatured.
 */
@Entity
@Table(name = "testimonials")
public class Testimonial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String guestName;

    @Column(nullable = false, length = 1000)
    private String quote;

    private Integer rating;

    private String roomStayed;

    private LocalDate stayDate;

    private boolean featured;

    private Instant createdAt;

    // Null for admin-entered testimonials (unchanged legacy path). Set only when a guest
    // submits their own review, both to prevent a second submission for the same stay
    // (see TestimonialRepository.existsByBookingId) and so the admin list can show which
    // reviews are guest-verified vs staff-transcribed.
    private Long bookingId;

    protected Testimonial() {}

    public Testimonial(String guestName, String quote, Integer rating, String roomStayed,
                        LocalDate stayDate, boolean featured, Instant createdAt) {
        this.guestName = guestName;
        this.quote = quote;
        this.rating = rating;
        this.roomStayed = roomStayed;
        this.stayDate = stayDate;
        this.featured = featured;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public String getGuestName() { return guestName; }
    public String getQuote() { return quote; }
    public Integer getRating() { return rating; }
    public String getRoomStayed() { return roomStayed; }
    public LocalDate getStayDate() { return stayDate; }
    public boolean isFeatured() { return featured; }
    public void setFeatured(boolean featured) { this.featured = featured; }
    public Instant getCreatedAt() { return createdAt; }
    public Long getBookingId() { return bookingId; }
    public void setBookingId(Long bookingId) { this.bookingId = bookingId; }
}
