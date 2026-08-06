package com.thebalconyhouse.backend.profile;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "guest_profiles")
public class GuestProfile {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    private String phone;
    private String gender;
    private LocalDate dateOfBirth;

    protected GuestProfile() {}

    public GuestProfile(String email, String phone, String gender, LocalDate dateOfBirth) {
        this.email = email;
        this.phone = phone;
        this.gender = gender;
        this.dateOfBirth = dateOfBirth;
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getGender() { return gender; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }

    public void update(String phone, String gender, LocalDate dateOfBirth) {
        this.phone = phone;
        this.gender = gender;
        this.dateOfBirth = dateOfBirth;
    }
}
