package com.thebalconyhouse.backend.booking;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    Optional<Invoice> findByBookingGroupId(Long bookingGroupId);
    Optional<Invoice> findByBookingId(Long bookingId);
}
