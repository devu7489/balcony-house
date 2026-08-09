package com.thebalconyhouse.backend.property;

import com.thebalconyhouse.backend.booking.BookingService;
import com.thebalconyhouse.backend.property.dto.AvailabilityDto;
import com.thebalconyhouse.backend.property.dto.PropertyDto;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/properties")
public class PropertyController {

    private final PropertyService service;
    private final BookingService bookingService;

    public PropertyController(PropertyService service, BookingService bookingService) {
        this.service = service;
        this.bookingService = bookingService;
    }

    @GetMapping
    public List<PropertyDto> all() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public PropertyDto one(@PathVariable Long id) {
        return service.findById(id);
    }

    @GetMapping("/{id}/availability")
    public AvailabilityDto availability(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut) {
        return bookingService.checkAvailability(id, checkIn, checkOut);
    }
}
