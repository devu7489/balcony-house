package com.thebalconyhouse.backend.booking.dto;

import jakarta.validation.constraints.NotBlank;

public record PaymentRequest(@NotBlank String method, String reference) {}
