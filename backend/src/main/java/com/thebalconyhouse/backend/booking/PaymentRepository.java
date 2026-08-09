package com.thebalconyhouse.backend.booking;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByBookingIdOrderByPaidAtAsc(Long bookingId);
    List<Payment> findByBookingIdInOrderByPaidAtAsc(List<Long> bookingIds);
    List<Payment> findByPaidAtGreaterThanEqual(Instant from);
    List<Payment> findByPaidAtBetweenOrderByPaidAtAsc(Instant from, Instant to);
}
