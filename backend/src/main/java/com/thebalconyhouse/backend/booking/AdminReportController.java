package com.thebalconyhouse.backend.booking;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

// Requires ROLE_ADMIN (see SecurityConfig: /api/admin/** -> hasRole("ADMIN")).
@RestController
@RequestMapping("/api/admin/reports")
public class AdminReportController {

    private final ReportService reportService;

    public AdminReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/payments.csv")
    public ResponseEntity<String> paymentsCsv(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                               @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return csvResponse(reportService.paymentsCsv(from, to), "payments-" + from + "-to-" + to + ".csv");
    }

    @GetMapping("/bookings.csv")
    public ResponseEntity<String> bookingsCsv(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                               @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return csvResponse(reportService.bookingsCsv(from, to), "bookings-" + from + "-to-" + to + ".csv");
    }

    private ResponseEntity<String> csvResponse(String csv, String filename) {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(csv);
    }
}
