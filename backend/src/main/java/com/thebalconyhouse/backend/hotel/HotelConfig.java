package com.thebalconyhouse.backend.hotel;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.math.BigDecimal;
import java.util.List;

// Everything that makes a deployment of this codebase "this particular hotel" rather than
// another one - name/branding/contact/add-ons/room inventory - bound from the app.hotel.*
// block in application.yml. Re-skinning for a new client is meant to start and end with
// editing that YAML block (plus swapping the image files it points at).
@ConfigurationProperties(prefix = "app.hotel")
public record HotelConfig(
        String name,
        String tagline,
        Branding branding,
        Contact contact,
        Addons addons,
        List<RoomCategory> rooms
) {

    public record Branding(String logoUrl, String heroImageUrl) {}

    public record Contact(String email, String phone, String address) {}

    public record Addons(boolean childcareEnabled, boolean fullBoardEnabled) {}

    public record RoomCategory(
            String slug,
            String name,
            String description,
            BigDecimal pricePerNight,
            int maxGuests,
            boolean privateBalcony,
            boolean workspaceAvailable,
            String heroImageUrl,
            int totalUnits,
            List<String> highlights
    ) {}
}
