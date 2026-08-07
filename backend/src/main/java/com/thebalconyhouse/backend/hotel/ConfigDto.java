package com.thebalconyhouse.backend.hotel;

public record ConfigDto(
        String hotelName,
        String tagline,
        String logoUrl,
        String heroImageUrl,
        String contactEmail,
        String contactPhone,
        String address,
        boolean childcareEnabled,
        boolean fullBoardEnabled
) {}
