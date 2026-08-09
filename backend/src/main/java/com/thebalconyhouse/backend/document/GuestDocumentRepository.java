package com.thebalconyhouse.backend.document;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GuestDocumentRepository extends JpaRepository<GuestDocument, Long> {
    List<GuestDocument> findByBookingIdOrderByUploadedAtAsc(Long bookingId);
    boolean existsByBookingId(Long bookingId);
}
