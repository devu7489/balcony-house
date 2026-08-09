package com.thebalconyhouse.backend.hotel;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Public, no-auth: the frontend fetches this once on load to render hotel name, branding,
// and which add-ons are enabled, instead of hardcoding them - the same frontend build
// works for any deployment of this codebase.
@RestController
@RequestMapping("/api/config")
public class ConfigController {

    private final HotelConfig hotelConfig;

    public ConfigController(HotelConfig hotelConfig) {
        this.hotelConfig = hotelConfig;
    }

    @GetMapping
    public ConfigDto get() {
        return new ConfigDto(
                hotelConfig.name(),
                hotelConfig.tagline(),
                hotelConfig.branding().logoUrl(),
                hotelConfig.branding().heroImageUrl(),
                hotelConfig.contact().email(),
                hotelConfig.contact().phone(),
                hotelConfig.contact().address(),
                hotelConfig.addons().childcareEnabled(),
                hotelConfig.addons().fullBoardEnabled(),
                hotelConfig.policies().checkInTime(),
                hotelConfig.policies().checkOutTime(),
                hotelConfig.policies().notes()
        );
    }
}
