package com.thebalconyhouse.backend.testimonial;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Admin-curated, not guest-submitted - staff add a quote from a guest (email, review site,
 * in person) rather than guests posting directly. Avoids needing a moderation queue or spam
 * protection for a public-facing submission form; matches how Journal/Gallery content is
 * already admin/seed-driven rather than user-generated in this app.
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
    public Instant getCreatedAt() { return createdAt; }
}
