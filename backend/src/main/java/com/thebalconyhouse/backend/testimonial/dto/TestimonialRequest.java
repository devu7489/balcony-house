package com.thebalconyhouse.backend.testimonial.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.time.LocalDate;

public record TestimonialRequest(
        @NotBlank String guestName,
        @NotBlank String quote,
        @Min(1) @Max(5) Integer rating,
        String roomStayed,
        LocalDate stayDate,
        boolean featured
) {}
