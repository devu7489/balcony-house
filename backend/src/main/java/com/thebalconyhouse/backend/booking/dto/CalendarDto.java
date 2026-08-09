package com.thebalconyhouse.backend.booking.dto;

import java.time.LocalDate;
import java.util.List;

public record CalendarDto(List<LocalDate> dates, List<CalendarRoomDto> rooms) {

    public record CalendarRoomDto(Long propertyId, String propertyName, int totalUnits, List<Integer> unitsBookedByDay) {}
}
