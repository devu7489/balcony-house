package com.thebalconyhouse.backend.cafe;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

// One row per in-room-dining line item billed to a stay, always attached to the trip's
// addon-bearer booking (same room that carries childcareFee/fullBoardFee) so it's billed
// exactly once per trip, not once per room. itemName/unitPrice are snapshotted at order
// time - same reasoning as Payment being an immutable fact - so a later café menu price
// edit never rewrites what a past guest was actually charged. Removed via "voided" rather
// than a hard delete, matching how cancellations/refunds elsewhere are status flips or
// negative rows, never deletions, so there's always an audit trail.
@Entity
@Table(name = "food_orders")
public class FoodOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long bookingId;
    private Long bookingGroupId;
    private Long cafeItemId;
    private String itemName;
    private BigDecimal unitPrice;
    private int quantity;
    private BigDecimal lineTotal;
    private Instant orderedAt;
    private boolean voided;

    protected FoodOrder() {}

    public FoodOrder(Long bookingId, Long bookingGroupId, Long cafeItemId, String itemName,
                      BigDecimal unitPrice, int quantity, Instant orderedAt) {
        this.bookingId = bookingId;
        this.bookingGroupId = bookingGroupId;
        this.cafeItemId = cafeItemId;
        this.itemName = itemName;
        this.unitPrice = unitPrice;
        this.quantity = quantity;
        this.lineTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
        this.orderedAt = orderedAt;
        this.voided = false;
    }

    public Long getId() { return id; }
    public Long getBookingId() { return bookingId; }
    public Long getBookingGroupId() { return bookingGroupId; }
    public Long getCafeItemId() { return cafeItemId; }
    public String getItemName() { return itemName; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public int getQuantity() { return quantity; }
    public BigDecimal getLineTotal() { return lineTotal; }
    public Instant getOrderedAt() { return orderedAt; }
    public boolean isVoided() { return voided; }
    public void setVoided(boolean voided) { this.voided = voided; }
}
