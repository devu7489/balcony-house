package com.thebalconyhouse.backend.addon.dto;

import java.math.BigDecimal;

public record ChildcarePricingDto(BigDecimal perDayRate, BigDecimal totalPerChild, int maxChildren) {}
