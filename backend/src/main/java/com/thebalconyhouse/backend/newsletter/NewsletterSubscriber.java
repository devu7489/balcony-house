package com.thebalconyhouse.backend.newsletter;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "newsletter_subscribers", uniqueConstraints = @UniqueConstraint(columnNames = "email"))
public class NewsletterSubscriber {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String email;
    private Instant subscribedAt;

    protected NewsletterSubscriber() {}
    public NewsletterSubscriber(String email, Instant subscribedAt) {
        this.email = email; this.subscribedAt = subscribedAt;
    }
    public Long getId() { return id; }
    public String getEmail() { return email; }
    public Instant getSubscribedAt() { return subscribedAt; }
}
