package com.thebalconyhouse.backend.hotel;

import com.thebalconyhouse.backend.property.Property;
import com.thebalconyhouse.backend.property.PropertyRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

// Keeps the properties table in sync with app.hotel.rooms on every startup - the single
// source of truth for room inventory is the YAML config, not a hand-maintained data.sql.
// Existing rows are matched by slug first, falling back to name (for rows seeded before
// slugs existed), so renaming a room in config doesn't orphan its bookings.
@Component
public class HotelSeeder implements ApplicationRunner {

    private final PropertyRepository propertyRepository;
    private final HotelConfig hotelConfig;

    public HotelSeeder(PropertyRepository propertyRepository, HotelConfig hotelConfig) {
        this.propertyRepository = propertyRepository;
        this.hotelConfig = hotelConfig;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        for (HotelConfig.RoomCategory config : hotelConfig.rooms()) {
            Property property = propertyRepository.findBySlug(config.slug())
                    .or(() -> propertyRepository.findByName(config.name()))
                    .orElseGet(Property::new);

            property.applyConfig(config.slug(), config.name(), config.description(), config.pricePerNight(),
                    config.maxGuests(), config.privateBalcony(), config.workspaceAvailable(),
                    config.heroImageUrl(), config.totalUnits(), config.highlights(), config.photoUrls());

            propertyRepository.save(property);
        }
    }
}
