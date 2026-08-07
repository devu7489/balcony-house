package com.thebalconyhouse.backend.newsletter.dto;

import java.time.Instant;

public record NewsletterSubscriberDto(Long id, String email, Instant subscribedAt) {
}
