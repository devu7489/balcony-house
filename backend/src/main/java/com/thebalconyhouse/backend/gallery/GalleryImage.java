package com.thebalconyhouse.backend.gallery;

import jakarta.persistence.*;

@Entity
@Table(name = "gallery_images")
public class GalleryImage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String imageUrl;
    private String caption;
    private String category; // rooms, mountains, cafe, experiences...
    private int sortOrder;

    protected GalleryImage() {}
    public GalleryImage(String imageUrl, String caption, String category, int sortOrder) {
        this.imageUrl = imageUrl; this.caption = caption; this.category = category; this.sortOrder = sortOrder;
    }
    public Long getId() { return id; }
    public String getImageUrl() { return imageUrl; }
    public String getCaption() { return caption; }
    public String getCategory() { return category; }
    public int getSortOrder() { return sortOrder; }
}
