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
        Gst gst,
        Addons addons,
        Policies policies,
        List<RoomCategory> rooms
) {

    public record Branding(String logoUrl, String heroImageUrl) {}

    public record Contact(String email, String phone, String address) {}

    /** checkIn/checkOut are still DATE-only everywhere in the booking flow (see
     *  Booking.checkIn/checkOut) - these are the property's stated arrival/departure
     *  clock times, shown to guests as-is, and also parsed by BookingService (see its
     *  checkInTimeOfDay()) so a same-day cancellation after this time counts as a night
     *  used rather than a free before-check-in cancellation. Expected format: "h:mm a"
     *  (e.g. "12:00 PM") - an unparseable value falls back to noon rather than failing. */
    public record Policies(String checkInTime, String checkOutTime, List<String> notes) {}

    /** See this block's own comment in application.yml for why rate-percent is configurable
     *  rather than hardcoded. */
    public record Gst(boolean enabled, String gstin, String legalName, String stateName, String hsnCode, BigDecimal ratePercent) {}

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
            List<String> highlights,
            List<String> photoUrls
    ) {}
}
