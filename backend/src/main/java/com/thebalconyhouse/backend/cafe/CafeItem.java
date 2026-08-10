package com.thebalconyhouse.backend.cafe;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "cafe_items")
public class CafeItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String description;
    private String imageUrl;
    private String category; // coffee, breakfast, snack
    private BigDecimal price;

    protected CafeItem() {}
    public CafeItem(String name, String description, String imageUrl, String category, BigDecimal price) {
        this.name = name; this.description = description; this.imageUrl = imageUrl; this.category = category;
        this.price = price;
    }
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getImageUrl() { return imageUrl; }
    public String getCategory() { return category; }
    public BigDecimal getPrice() { return price; }
}
