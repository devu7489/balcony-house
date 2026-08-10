package com.thebalconyhouse.backend.booking;

// Computed automatically at cancel time (see BookingService.classifyCancellation) from data
// the system already has - no admin input needed. Purely descriptive metadata alongside
// BookingStatus.CANCELLED; the refund math in CancellationPolicy is unaffected by this.
public enum CancellationType {
    PRE_ARRIVAL,
    MID_STAY,
    NO_SHOW
}
