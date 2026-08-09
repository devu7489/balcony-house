package com.thebalconyhouse.backend.testimonial.dto;

import java.time.Instant;
import java.time.LocalDate;

public record TestimonialDto(Long id, String guestName, String quote, Integer rating, String roomStayed,
                              LocalDate stayDate, boolean featured, Instant createdAt) {}
