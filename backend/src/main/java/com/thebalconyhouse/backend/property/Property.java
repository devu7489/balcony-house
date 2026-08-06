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

    protected Property() {}

    public Property(String name, String description, BigDecimal pricePerNight, int maxGuests,
                     boolean privateBalcony, boolean workspaceAvailable, String heroImageUrl,
                     int totalUnits, List<String> highlights) {
        this.name = name;
        this.description = description;
        this.pricePerNight = pricePerNight;
        this.maxGuests = maxGuests;
        this.privateBalcony = privateBalcony;
        this.workspaceAvailable = workspaceAvailable;
        this.heroImageUrl = heroImageUrl;
        this.totalUnits = totalUnits;
        this.highlights = highlights;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public BigDecimal getPricePerNight() { return pricePerNight; }
    public int getMaxGuests() { return maxGuests; }
    public boolean isPrivateBalcony() { return privateBalcony; }
    public boolean isWorkspaceAvailable() { return workspaceAvailable; }
    public String getHeroImageUrl() { return heroImageUrl; }
    public int getTotalUnits() { return totalUnits; }
    public List<String> getHighlights() { return highlights; }
}
