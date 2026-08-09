package com.thebalconyhouse.backend.booking.dto;

import java.time.Instant;
import java.time.LocalDate;

public record RoomBlockDto(Long id, Long propertyId, String propertyName, LocalDate startDate, LocalDate endDate,
                            String reason, Instant createdAt) {}
