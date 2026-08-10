package com.thebalconyhouse.backend.booking.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

// Real cap on childrenCount is 2 kids per room, enforced dynamically in BookingService (see
// BookingGroupRequest.childrenCount for why the annotation here is just a generous outer
// bound). childcareSessions/buffetSessions are the actual fee drivers - see
// BookingService.applyAddons - not tightly bound to nights here so the front desk can log an
// unusual case without a hard rejection; the frontend's own dropdowns stay physically sensible.
public record AddonUpdateRequest(
        @Min(0) @Max(24) int childrenCount,
        @Min(0) @Max(60) int childcareSessions,
        @Min(0) @Max(60) int buffetSessions
) {}
