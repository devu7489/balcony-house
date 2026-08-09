package com.thebalconyhouse.backend.booking.dto;

import java.time.Instant;

public record BookingActivityDto(Long id, String action, String performedBy, String details, Instant occurredAt) {}
