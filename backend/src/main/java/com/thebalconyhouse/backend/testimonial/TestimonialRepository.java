package com.thebalconyhouse.backend.testimonial;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TestimonialRepository extends JpaRepository<Testimonial, Long> {
    List<Testimonial> findAllByOrderByCreatedAtDesc();
    List<Testimonial> findByFeaturedTrueOrderByCreatedAtDesc();
    boolean existsByBookingId(Long bookingId);
    Optional<Testimonial> findByBookingId(Long bookingId);
}
