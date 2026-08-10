package com.thebalconyhouse.backend.addon.dto;

import java.math.BigDecimal;

public record FullBoardPricingDto(BigDecimal pricePerPersonPerDay, BigDecimal pricePerSession) {}
