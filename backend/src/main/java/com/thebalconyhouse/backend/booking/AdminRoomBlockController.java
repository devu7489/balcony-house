package com.thebalconyhouse.backend.booking;

import com.thebalconyhouse.backend.booking.dto.RoomBlockDto;
import com.thebalconyhouse.backend.booking.dto.RoomBlockRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Requires ROLE_ADMIN (see SecurityConfig: /api/admin/** -> hasRole("ADMIN")).
@RestController
@RequestMapping("/api/admin/room-blocks")
public class AdminRoomBlockController {

    private final RoomBlockService roomBlockService;

    public AdminRoomBlockController(RoomBlockService roomBlockService) {
        this.roomBlockService = roomBlockService;
    }

    @GetMapping
    public List<RoomBlockDto> all() {
        return roomBlockService.findAll();
    }

    @PostMapping
    public RoomBlockDto create(@Valid @RequestBody RoomBlockRequest request) {
        return roomBlockService.create(request.propertyId(), request.startDate(), request.endDate(), request.reason());
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        roomBlockService.delete(id);
    }
}
