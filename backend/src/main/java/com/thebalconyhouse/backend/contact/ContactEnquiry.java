package com.thebalconyhouse.backend.contact;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "contact_enquiries")
public class ContactEnquiry {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String email;
    @Column(length = 2000)
    private String message;
    private Instant submittedAt;

    protected ContactEnquiry() {}
    public ContactEnquiry(String name, String email, String message, Instant submittedAt) {
        this.name = name; this.email = email; this.message = message; this.submittedAt = submittedAt;
    }
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getMessage() { return message; }
    public Instant getSubmittedAt() { return submittedAt; }
}
