package com.thebalconyhouse.backend.experience.dto;

import com.thebalconyhouse.backend.experience.Experience;

public record ExperienceDto(Long id, String title, String description, String imageUrl) {
    public static ExperienceDto from(Experience e) {
        return new ExperienceDto(e.getId(), e.getTitle(), e.getDescription(), e.getImageUrl());
    }
}
