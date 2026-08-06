package com.thebalconyhouse.backend.cafe;

import jakarta.persistence.*;

@Entity
@Table(name = "cafe_items")
public class CafeItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String description;
    private String imageUrl;
    private String category; // coffee, breakfast, local

    protected CafeItem() {}
    public CafeItem(String name, String description, String imageUrl, String category) {
        this.name = name; this.description = description; this.imageUrl = imageUrl; this.category = category;
    }
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getImageUrl() { return imageUrl; }
    public String getCategory() { return category; }
}
