package com.thebalconyhouse.backend.booking.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record GuestSummaryDto(String email, String name, String phone, long stayCount,
                               BigDecimal totalSpend, LocalDate lastCheckOut) {}
