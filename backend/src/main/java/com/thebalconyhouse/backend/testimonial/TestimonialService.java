package com.thebalconyhouse.backend.testimonial;

import com.thebalconyhouse.backend.booking.Booking;
import com.thebalconyhouse.backend.booking.BookingRepository;
import com.thebalconyhouse.backend.booking.BookingStatus;
import com.thebalconyhouse.backend.common.ForbiddenException;
import com.thebalconyhouse.backend.common.ResourceNotFoundException;
import com.thebalconyhouse.backend.property.Property;
import com.thebalconyhouse.backend.property.PropertyRepository;
import com.thebalconyhouse.backend.testimonial.dto.GuestTestimonialRequest;
import com.thebalconyhouse.backend.testimonial.dto.TestimonialDto;
import com.thebalconyhouse.backend.testimonial.dto.TestimonialRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class TestimonialService {

    private final TestimonialRepository repository;
    private final BookingRepository bookingRepository;
    private final PropertyRepository propertyRepository;

    public TestimonialService(TestimonialRepository repository, BookingRepository bookingRepository,
                               PropertyRepository propertyRepository) {
        this.repository = repository;
        this.bookingRepository = bookingRepository;
        this.propertyRepository = propertyRepository;
    }

    public List<TestimonialDto> findAll() {
        return repository.findAllByOrderByCreatedAtDesc().stream().map(this::toDto).toList();
    }

    public List<TestimonialDto> findFeatured() {
        return repository.findByFeaturedTrueOrderByCreatedAtDesc().stream().map(this::toDto).toList();
    }

    @Transactional
    public TestimonialDto create(TestimonialRequest request) {
        Testimonial saved = repository.save(new Testimonial(
                request.guestName(), request.quote(), request.rating(), request.roomStayed(),
                request.stayDate(), request.featured(), Instant.now()
        ));
        return toDto(saved);
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Testimonial " + id + " not found");
        }
        repository.deleteById(id);
    }

    /**
     * The spam guard in place of a moderation queue (see Testimonial's own comment): only the
     * guest who owns a booking that's actually reached CHECKED_OUT can submit, and only once.
     * name/room/date are derived from the booking rather than guest-supplied, both so they
     * can't be faked and so the guest only has to write the two things that are actually
     * theirs to say - the quote and the rating.
     */
    @Transactional
    public TestimonialDto submitForBooking(Long bookingId, String guestEmail, GuestTestimonialRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking " + bookingId + " not found"));
        if (!guestEmail.equals(booking.getGuestEmail())) {
            throw new ForbiddenException("You can only review your own stay");
        }
        if (booking.getStatus() != BookingStatus.CHECKED_OUT) {
            throw new IllegalArgumentException("Only checked-out stays can be reviewed");
        }
        if (repository.existsByBookingId(bookingId)) {
            throw new IllegalArgumentException("You've already reviewed this stay");
        }
        Property property = propertyRepository.findById(booking.getPropertyId()).orElse(null);
        Testimonial testimonial = new Testimonial(booking.getGuestName(), request.quote(), request.rating(),
                property != null ? property.getName() : null, booking.getCheckIn(), false, Instant.now());
        testimonial.setBookingId(bookingId);
        return toDto(repository.save(testimonial));
    }

    public TestimonialDto findForOwnBooking(Long bookingId, String guestEmail) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking " + bookingId + " not found"));
        if (!guestEmail.equals(booking.getGuestEmail())) {
            throw new ForbiddenException("You can only view your own review");
        }
        Testimonial testimonial = repository.findByBookingId(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("No review yet for booking " + bookingId));
        return toDto(testimonial);
    }

    /** The admin approve/hide toggle - featured could previously only be set at creation. */
    @Transactional
    public TestimonialDto setFeatured(Long id, boolean featured) {
        Testimonial testimonial = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Testimonial " + id + " not found"));
        testimonial.setFeatured(featured);
        return toDto(repository.save(testimonial));
    }

    private TestimonialDto toDto(Testimonial t) {
        return new TestimonialDto(t.getId(), t.getGuestName(), t.getQuote(), t.getRating(), t.getRoomStayed(),
                t.getStayDate(), t.isFeatured(), t.getCreatedAt(), t.getBookingId());
    }
}
