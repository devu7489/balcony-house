package com.thebalconyhouse.backend.property;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "properties")
public class Property {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Stable identifier used to match this row to a room category in app.hotel.rooms
    // config across restarts/renames. Left nullable at the DB level (no unique/not-null
    // constraint) so adding it to a table with existing rows never breaks schema update -
    // HotelSeeder backfills it on every startup by matching legacy rows on name first.
    private String slug;

    @Column(nullable = false)
    private String name;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    private BigDecimal pricePerNight;

    private int maxGuests;
    private boolean privateBalcony;
    private boolean workspaceAvailable;

    private String heroImageUrl;

    private int totalUnits;

    @ElementCollection
    @CollectionTable(name = "property_highlights", joinColumns = @JoinColumn(name = "property_id"))
    @Column(name = "highlight")
    private List<String> highlights = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "property_photo_urls", joinColumns = @JoinColumn(name = "property_id"))
    @Column(name = "photo_url")
    private List<String> photoUrls = new ArrayList<>();

    public Property() {}

    public Property(String slug, String name, String description, BigDecimal pricePerNight, int maxGuests,
                     boolean privateBalcony, boolean workspaceAvailable, String heroImageUrl,
                     int totalUnits, List<String> highlights, List<String> photoUrls) {
        this.slug = slug;
        this.name = name;
        this.description = description;
        this.pricePerNight = pricePerNight;
        this.maxGuests = maxGuests;
        this.privateBalcony = privateBalcony;
        this.workspaceAvailable = workspaceAvailable;
        this.heroImageUrl = heroImageUrl;
        this.totalUnits = totalUnits;
        this.highlights = highlights;
        this.photoUrls = photoUrls;
    }

    // Applies room-category config on top of this row - used by HotelSeeder to keep
    // existing rows in sync with app.hotel.rooms on every startup. Mutates the highlights/
    // photoUrls collections in place (clear+addAll) rather than reassigning them, since on a
    // Hibernate-managed entity replacing an @ElementCollection field's reference outright
    // loses dirty-tracking on that collection.
    public void applyConfig(String slug, String name, String description, BigDecimal pricePerNight, int maxGuests,
                             boolean privateBalcony, boolean workspaceAvailable, String heroImageUrl,
                             int totalUnits, List<String> highlights, List<String> photoUrls) {
        this.slug = slug;
        this.name = name;
        this.description = description;
        this.pricePerNight = pricePerNight;
        this.maxGuests = maxGuests;
        this.privateBalcony = privateBalcony;
        this.workspaceAvailable = workspaceAvailable;
        this.heroImageUrl = heroImageUrl;
        this.totalUnits = totalUnits;
        this.highlights.clear();
        this.highlights.addAll(highlights);
        this.photoUrls.clear();
        this.photoUrls.addAll(photoUrls);
    }

    public Long getId() { return id; }
    public String getSlug() { return slug; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public BigDecimal getPricePerNight() { return pricePerNight; }
    public int getMaxGuests() { return maxGuests; }
    public boolean isPrivateBalcony() { return privateBalcony; }
    public boolean isWorkspaceAvailable() { return workspaceAvailable; }
    public String getHeroImageUrl() { return heroImageUrl; }
    public int getTotalUnits() { return totalUnits; }
    public List<String> getHighlights() { return highlights; }
    public List<String> getPhotoUrls() { return photoUrls; }
}
