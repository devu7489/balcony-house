package com.thebalconyhouse.backend.booking.dto;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

// amount is optional: omit it (or send null) to pay the full balance currently due, or set
// it explicitly to record a partial payment - each call always creates its own itemized
// Payment row rather than overwriting a single "latest payment" snapshot.
public record PaymentRequest(BigDecimal amount, @NotBlank String method, String reference) {}
