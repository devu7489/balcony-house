package com.thebalconyhouse.backend.hotel;

import java.util.List;

public record ConfigDto(
        String hotelName,
        String tagline,
        String logoUrl,
        String heroImageUrl,
        String contactEmail,
        String contactPhone,
        String address,
        boolean childcareEnabled,
        boolean fullBoardEnabled,
        String checkInTime,
        String checkOutTime,
        List<String> policyNotes
) {}
