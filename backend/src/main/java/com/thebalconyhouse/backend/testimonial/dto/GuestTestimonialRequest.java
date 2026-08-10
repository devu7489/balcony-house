package com.thebalconyhouse.backend.testimonial.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// Deliberately just the two things a guest actually writes - name/room/date come from their
// booking instead (see TestimonialService.submitForBooking), so they can't be faked.
public record GuestTestimonialRequest(
        @NotBlank @Size(max = 1000) String quote,
        @Min(1) @Max(5) int rating
) {}
