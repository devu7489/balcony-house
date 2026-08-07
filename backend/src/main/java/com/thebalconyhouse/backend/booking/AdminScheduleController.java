package com.thebalconyhouse.backend.booking;

import com.thebalconyhouse.backend.booking.dto.TodayScheduleDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Requires ROLE_ADMIN (see SecurityConfig: /api/admin/** -> hasRole("ADMIN")).
@RestController
@RequestMapping("/api/admin/schedule")
public class AdminScheduleController {

    private final BookingService bookingService;

    public AdminScheduleController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping("/today")
    public TodayScheduleDto today() {
        return bookingService.findTodaySchedule();
    }
}
