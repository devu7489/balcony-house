package com.thebalconyhouse.backend.addon.dto;

import java.math.BigDecimal;

public record ChildcarePricingDto(BigDecimal pricePerChild, int maxChildren) {}
