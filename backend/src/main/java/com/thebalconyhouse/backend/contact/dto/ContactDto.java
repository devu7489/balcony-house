package com.thebalconyhouse.backend.contact.dto;

import java.time.Instant;

public record ContactDto(Long id, String name, String email, String message, Instant submittedAt) {
}
