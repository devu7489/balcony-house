package com.thebalconyhouse.backend.cafe.dto;

import com.thebalconyhouse.backend.cafe.CafeItem;

public record CafeItemDto(Long id, String name, String description, String imageUrl, String category) {
    public static CafeItemDto from(CafeItem c) {
        return new CafeItemDto(c.getId(), c.getName(), c.getDescription(), c.getImageUrl(), c.getCategory());
    }
}
