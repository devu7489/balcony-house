package com.thebalconyhouse.backend.property.dto;

import java.math.BigDecimal;
import java.util.List;

public record PropertyDto(
        Long id,
        String name,
        String description,
        BigDecimal pricePerNight,
        int maxGuests,
        boolean privateBalcony,
        boolean workspaceAvailable,
        String heroImageUrl,
        int totalUnits,
        List<String> highlights,
        List<String> photoUrls
) {}
