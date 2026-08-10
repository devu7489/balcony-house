package com.thebalconyhouse.backend.cafe;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FoodOrderRepository extends JpaRepository<FoodOrder, Long> {
    List<FoodOrder> findByBookingIdAndVoidedFalseOrderByOrderedAtAsc(Long bookingId);
    List<FoodOrder> findByBookingIdInAndVoidedFalseOrderByOrderedAtAsc(List<Long> bookingIds);
}
