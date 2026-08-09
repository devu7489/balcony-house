package com.thebalconyhouse.backend.booking;

import com.thebalconyhouse.backend.booking.dto.RoomStatusDto;
import com.thebalconyhouse.backend.booking.dto.RoomStatusRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Requires ROLE_ADMIN (see SecurityConfig: /api/admin/** -> hasRole("ADMIN")).
@RestController
@RequestMapping("/api/admin/room-status")
public class AdminRoomStatusController {

    private final RoomStatusService roomStatusService;

    public AdminRoomStatusController(RoomStatusService roomStatusService) {
        this.roomStatusService = roomStatusService;
    }

    @GetMapping
    public List<RoomStatusDto> all() {
        return roomStatusService.findAll();
    }

    @PostMapping
    public RoomStatusDto set(@Valid @RequestBody RoomStatusRequest request, @AuthenticationPrincipal OAuth2User principal) {
        Object email = principal.getAttribute("email");
        return roomStatusService.setStatus(request.propertyId(), request.roomNumber(), request.status(),
                email != null ? email.toString() : "unknown");
    }
}
