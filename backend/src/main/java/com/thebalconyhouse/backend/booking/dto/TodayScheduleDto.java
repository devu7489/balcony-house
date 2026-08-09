package com.thebalconyhouse.backend.booking.dto;

import java.util.List;

public record TodayScheduleDto(
        List<BookingDto> arrivals,
        List<BookingDto> departures
) {}
