package com.thebalconyhouse.backend.gallery.dto;

import com.thebalconyhouse.backend.gallery.GalleryImage;

public record GalleryImageDto(Long id, String imageUrl, String caption, String category) {
    public static GalleryImageDto from(GalleryImage img) {
        return new GalleryImageDto(img.getId(), img.getImageUrl(), img.getCaption(), img.getCategory());
    }
}
