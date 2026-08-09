package com.thebalconyhouse.backend.booking;

import com.thebalconyhouse.backend.booking.dto.CalendarDto;
import com.thebalconyhouse.backend.booking.dto.DashboardDto;
import com.thebalconyhouse.backend.booking.dto.GuestSummaryDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// Requires ROLE_ADMIN (see SecurityConfig: /api/admin/** -> hasRole("ADMIN")).
@RestController
@RequestMapping("/api/admin")
public class AdminInsightsController {

    private final AdminInsightsService insightsService;

    public AdminInsightsController(AdminInsightsService insightsService) {
        this.insightsService = insightsService;
    }

    @GetMapping("/dashboard")
    public DashboardDto dashboard() {
        return insightsService.dashboard();
    }

    @GetMapping("/calendar")
    public CalendarDto calendar(@RequestParam(defaultValue = "30") int days) {
        return insightsService.calendar(days);
    }

    @GetMapping("/guests")
    public List<GuestSummaryDto> guests() {
        return insightsService.guestDirectory();
    }
}
