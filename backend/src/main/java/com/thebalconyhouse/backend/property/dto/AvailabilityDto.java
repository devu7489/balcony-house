package com.thebalconyhouse.backend.property.dto;

import java.math.BigDecimal;

public record AvailabilityDto(boolean available, int unitsLeft, BigDecimal pricePerNight) {}
