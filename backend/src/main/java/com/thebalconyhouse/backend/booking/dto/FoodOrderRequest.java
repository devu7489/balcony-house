package com.thebalconyhouse.backend.booking.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record FoodOrderRequest(@NotNull Long cafeItemId, @Min(1) int quantity) {}
