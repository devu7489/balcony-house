package com.thebalconyhouse.backend.booking.dto;

import java.math.BigDecimal;

public record InvoiceLineDto(String description, BigDecimal amount) {}
