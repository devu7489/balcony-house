package com.thebalconyhouse.backend.booking;

import com.thebalconyhouse.backend.booking.dto.AdminBookingRequest;
import com.thebalconyhouse.backend.booking.dto.BookingDto;
import com.thebalconyhouse.backend.booking.dto.BookingRequest;
import com.thebalconyhouse.backend.common.ForbiddenException;
import com.thebalconyhouse.backend.common.ResourceNotFoundException;
import com.thebalconyhouse.backend.property.Property;
import com.thebalconyhouse.backend.property.PropertyRepository;
import com.thebalconyhouse.backend.property.dto.AvailabilityDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

@Service
@Transactional(readOnly = true)
public class BookingService {

    private final BookingRepository bookingRepository;
    private final PropertyRepository propertyRepository;

    public BookingService(BookingRepository bookingRepository, PropertyRepository propertyRepository) {
        this.bookingRepository = bookingRepository;
        this.propertyRepository = propertyRepository;
    }

    public AvailabilityDto checkAvailability(Long propertyId, LocalDate checkIn, LocalDate checkOut) {
        Property property = findProperty(propertyId);
        int unitsLeft = unitsLeft(property, checkIn, checkOut);
        return new AvailabilityDto(unitsLeft > 0, Math.max(unitsLeft, 0));
    }

    @Transactional
    public BookingDto create(BookingRequest request, String guestEmail, String guestName) {
        return createInternal(request.propertyId(), guestEmail, guestName, request.guestPhone(),
                request.checkIn(), request.checkOut(), request.guests(), request.notes());
    }

    @Transactional
    public BookingDto createForAdmin(AdminBookingRequest request) {
        return createInternal(request.propertyId(), request.guestEmail(), request.guestName(), request.guestPhone(),
                request.checkIn(), request.checkOut(), request.guests(), request.notes());
    }

    private BookingDto createInternal(Long propertyId, String guestEmail, String guestName, String guestPhone,
                                       LocalDate checkIn, LocalDate checkOut, int guests, String notes) {
        Property property = findProperty(propertyId);

        if (!checkOut.isAfter(checkIn)) {
            throw new IllegalArgumentException("Check-out must be after check-in");
        }
        if (guests > property.getMaxGuests()) {
            throw new IllegalArgumentException("This room sleeps at most " + property.getMaxGuests() + " guests");
        }
        if (unitsLeft(property, checkIn, checkOut) <= 0) {
            throw new RoomUnavailableException("No rooms of this type are available for the selected dates");
        }

        Booking saved = bookingRepository.save(new Booking(property.getId(), guestEmail, guestName, guestPhone,
                checkIn, checkOut, guests, notes, Instant.now()));
        return toDto(saved, property);
    }

    public BookingDto findById(Long bookingId) {
        Booking booking = findBooking(bookingId);
        return toDto(booking, propertyRepository.findById(booking.getPropertyId()).orElse(null));
    }

    public List<BookingDto> findMine(String guestEmail) {
        return enrich(bookingRepository.findByGuestEmail(guestEmail));
    }

    public List<BookingDto> findAll() {
        return enrich(bookingRepository.findAllByOrderByCheckInDesc());
    }

    @Transactional
    public BookingDto checkIn(Long bookingId) {
        Booking booking = findBooking(bookingId);
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new IllegalArgumentException("Only confirmed bookings can be checked in");
        }
        return transitionTo(booking, BookingStatus.CHECKED_IN);
    }

    @Transactional
    public BookingDto checkOut(Long bookingId) {
        Booking booking = findBooking(bookingId);
        if (booking.getStatus() != BookingStatus.CHECKED_IN) {
            throw new IllegalArgumentException("Only checked-in bookings can be checked out");
        }
        return transitionTo(booking, BookingStatus.CHECKED_OUT);
    }

    @Transactional
    public BookingDto cancel(Long bookingId) {
        return cancelInternal(findBooking(bookingId));
    }

    @Transactional
    public BookingDto cancelOwn(Long bookingId, String guestEmail) {
        Booking booking = findBooking(bookingId);
        if (!guestEmail.equals(booking.getGuestEmail())) {
            throw new ForbiddenException("You can only cancel your own bookings");
        }
        return cancelInternal(booking);
    }

    private Booking findBooking(Long bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking " + bookingId + " not found"));
    }

    private BookingDto cancelInternal(Booking booking) {
        if (booking.getStatus() == BookingStatus.CHECKED_OUT) {
            throw new IllegalArgumentException("A completed stay can't be cancelled");
        }
        return transitionTo(booking, BookingStatus.CANCELLED);
    }

    private BookingDto transitionTo(Booking booking, BookingStatus status) {
        booking.setStatus(status);
        Booking saved = bookingRepository.save(booking);
        return toDto(saved, propertyRepository.findById(saved.getPropertyId()).orElse(null));
    }

    private List<BookingDto> enrich(List<Booking> bookings) {
        List<Long> propertyIds = bookings.stream().map(Booking::getPropertyId).distinct().toList();
        Map<Long, Property> propertiesById = propertyRepository.findAllById(propertyIds).stream()
                .collect(java.util.stream.Collectors.toMap(Property::getId, Function.identity()));
        return bookings.stream()
                .map(b -> toDto(b, propertiesById.get(b.getPropertyId())))
                .toList();
    }

    private int unitsLeft(Property property, LocalDate checkIn, LocalDate checkOut) {
        long overlapping = bookingRepository.countOverlapping(property.getId(), checkIn, checkOut);
        return property.getTotalUnits() - (int) overlapping;
    }

    private Property findProperty(Long propertyId) {
        return propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property " + propertyId + " not found"));
    }

    private BookingDto toDto(Booking b, Property property) {
        return new BookingDto(b.getId(), b.getPropertyId(),
                property != null ? property.getName() : null,
                property != null ? property.getHeroImageUrl() : null,
                b.getGuestEmail(), b.getGuestName(), b.getGuestPhone(),
                b.getCheckIn(), b.getCheckOut(), b.getGuests(), b.getNotes(), b.getStatus());
    }
}
