package com.thebalconyhouse.backend.experience;

import jakarta.persistence.*;

@Entity
@Table(name = "experiences")
public class Experience {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    @Column(length = 1000)
    private String description;
    private String imageUrl;

    protected Experience() {}
    public Experience(String title, String description, String imageUrl) {
        this.title = title; this.description = description; this.imageUrl = imageUrl;
    }
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getImageUrl() { return imageUrl; }
}
