package com.thebalconyhouse.backend.booking;

import com.thebalconyhouse.backend.booking.dto.BookingActivityDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class BookingActivityLogService {

    private final BookingActivityLogRepository repository;

    public BookingActivityLogService(BookingActivityLogRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void record(Long bookingId, Long bookingGroupId, String action, String performedBy, String details) {
        repository.save(new BookingActivityLog(bookingId, bookingGroupId, action, performedBy, details, Instant.now()));
    }

    public List<BookingActivityDto> findForBooking(Long bookingId) {
        return repository.findByBookingIdOrderByOccurredAtDesc(bookingId).stream().map(this::toDto).toList();
    }

    public List<BookingActivityDto> findForGroup(Long groupId, List<Long> bookingIds) {
        return repository.findForGroup(groupId, bookingIds).stream().map(this::toDto).toList();
    }

    private BookingActivityDto toDto(BookingActivityLog a) {
        return new BookingActivityDto(a.getId(), a.getAction(), a.getPerformedBy(), a.getDetails(), a.getOccurredAt());
    }
}
