package com.thebalconyhouse.backend.booking;

import com.thebalconyhouse.backend.booking.dto.AdminBookingRequest;
import com.thebalconyhouse.backend.booking.dto.BookingDto;
import com.thebalconyhouse.backend.booking.dto.BookingGroupRequest;
import com.thebalconyhouse.backend.booking.dto.BookingRequest;
import com.thebalconyhouse.backend.booking.dto.GroupRoomSelection;
import com.thebalconyhouse.backend.addon.ChildcarePricing;
import com.thebalconyhouse.backend.common.ForbiddenException;
import com.thebalconyhouse.backend.common.ResourceNotFoundException;
import com.thebalconyhouse.backend.property.Property;
import com.thebalconyhouse.backend.property.PropertyRepository;
import com.thebalconyhouse.backend.property.dto.AvailabilityDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

@Service
@Transactional(readOnly = true)
public class BookingService {

    private final BookingRepository bookingRepository;
    private final BookingGroupRepository bookingGroupRepository;
    private final PropertyRepository propertyRepository;

    public BookingService(BookingRepository bookingRepository, BookingGroupRepository bookingGroupRepository,
                           PropertyRepository propertyRepository) {
        this.bookingRepository = bookingRepository;
        this.bookingGroupRepository = bookingGroupRepository;
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
                request.checkIn(), request.checkOut(), request.guests(), request.notes(), null,
                PaymentStatus.PENDING, null, null, 0);
    }

    @Transactional
    public BookingDto createForAdmin(AdminBookingRequest request) {
        PaymentStatus paymentStatus = request.paymentReceived() ? PaymentStatus.PAID : PaymentStatus.PENDING;
        String paymentMethod = request.paymentReceived() ? request.paymentMethod() : null;
        String paymentReference = request.paymentReceived() ? request.paymentReference() : null;
        return createInternal(request.propertyId(), request.guestEmail(), request.guestName(), request.guestPhone(),
                request.checkIn(), request.checkOut(), request.guests(), request.notes(), null,
                paymentStatus, paymentMethod, paymentReference, request.childrenCount());
    }

    /**
     * Books every room in the request atomically: if any room fails validation (capacity,
     * guest count, availability - accounting for other rooms of the same type earlier in
     * this same request, not just what's already in the database), nothing is persisted.
     */
    @Transactional
    public List<BookingDto> createGroup(BookingGroupRequest request, String guestEmail, String guestName) {
        Map<Long, Integer> consumedInRequest = new HashMap<>();
        for (GroupRoomSelection selection : request.rooms()) {
            Property property = findProperty(selection.propertyId());
            validateRoom(property, request.checkIn(), request.checkOut(), selection.guests(),
                    consumedInRequest.getOrDefault(property.getId(), 0));
            consumedInRequest.merge(property.getId(), 1, Integer::sum);
        }

        BookingGroup group = bookingGroupRepository.save(new BookingGroup(guestEmail, guestName, request.guestPhone(),
                request.checkIn(), request.checkOut(), request.notes(), Instant.now()));

        return request.rooms().stream()
                .map(selection -> createInternal(selection.propertyId(), guestEmail, guestName, request.guestPhone(),
                        request.checkIn(), request.checkOut(), selection.guests(), request.notes(), group.getId(),
                        PaymentStatus.PENDING, null, null, request.childrenCount()))
                .toList();
    }

    private BookingDto createInternal(Long propertyId, String guestEmail, String guestName, String guestPhone,
                                       LocalDate checkIn, LocalDate checkOut, int guests, String notes, Long bookingGroupId,
                                       PaymentStatus initialPaymentStatus, String paymentMethod, String paymentReference,
                                       int childrenCount) {
        Property property = findProperty(propertyId);
        validateRoom(property, checkIn, checkOut, guests, 0);

        Booking booking = new Booking(property.getId(), guestEmail, guestName, guestPhone,
                checkIn, checkOut, guests, notes, Instant.now());
        booking.setBookingGroupId(bookingGroupId);
        booking.setAmount(computeAmount(property, checkIn, checkOut));
        booking.setInitialPayment(initialPaymentStatus, paymentMethod, paymentReference);
        booking.setChildcare(childrenCount, ChildcarePricing.PRICE_PER_CHILD.multiply(BigDecimal.valueOf(childrenCount)));
        Booking saved = bookingRepository.save(booking);
        return toDto(saved, property);
    }

    private BigDecimal computeAmount(Property property, LocalDate checkIn, LocalDate checkOut) {
        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);
        return property.getPricePerNight().multiply(BigDecimal.valueOf(nights));
    }

    private void validateRoom(Property property, LocalDate checkIn, LocalDate checkOut, int guests, int alreadyConsumed) {
        if (!checkOut.isAfter(checkIn)) {
            throw new IllegalArgumentException("Check-out must be after check-in");
        }
        if (guests > property.getMaxGuests()) {
            throw new IllegalArgumentException("This room sleeps at most " + property.getMaxGuests() + " guests");
        }
        if (unitsLeft(property, checkIn, checkOut) - alreadyConsumed <= 0) {
            throw new RoomUnavailableException("No rooms of this type are available for the selected dates");
        }
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

    public List<BookingDto> findByGroupId(Long groupId) {
        findGroup(groupId);
        return enrich(bookingRepository.findByBookingGroupId(groupId));
    }

    /**
     * Trip-level check-in/check-out/cancel: admin manages a trip as one unit rather than
     * room-by-room. Each only acts on rooms currently in the applicable state and leaves
     * the rest untouched, so a partially-progressed trip (e.g. one room already checked
     * out) doesn't block the action on the others.
     */
    @Transactional
    public List<BookingDto> checkInGroup(Long groupId) {
        findGroup(groupId);
        return bookingRepository.findByBookingGroupId(groupId).stream()
                .map(b -> b.getStatus() == BookingStatus.CONFIRMED
                        ? transitionTo(b, BookingStatus.CHECKED_IN)
                        : toDto(b, propertyRepository.findById(b.getPropertyId()).orElse(null)))
                .toList();
    }

    @Transactional
    public List<BookingDto> checkOutGroup(Long groupId) {
        findGroup(groupId);
        return bookingRepository.findByBookingGroupId(groupId).stream()
                .map(b -> b.getStatus() == BookingStatus.CHECKED_IN
                        ? transitionTo(b, BookingStatus.CHECKED_OUT)
                        : toDto(b, propertyRepository.findById(b.getPropertyId()).orElse(null)))
                .toList();
    }

    /**
     * Cancels every room in the trip that isn't already checked out (a completed stay is
     * left alone rather than failing the whole action) - this is the primary way bookings
     * get cancelled now, whether the trip has one room or several.
     */
    @Transactional
    public List<BookingDto> cancelGroup(Long groupId) {
        findGroup(groupId);
        return cancelGroupInternal(groupId);
    }

    @Transactional
    public List<BookingDto> cancelOwnGroup(Long groupId, String guestEmail) {
        BookingGroup group = findGroup(groupId);
        if (!guestEmail.equals(group.getGuestEmail())) {
            throw new ForbiddenException("You can only cancel your own trips");
        }
        return cancelGroupInternal(groupId);
    }

    private List<BookingDto> cancelGroupInternal(Long groupId) {
        return bookingRepository.findByBookingGroupId(groupId).stream()
                .map(b -> b.getStatus() == BookingStatus.CHECKED_OUT
                        ? toDto(b, propertyRepository.findById(b.getPropertyId()).orElse(null))
                        : transitionTo(b, BookingStatus.CANCELLED))
                .toList();
    }

    /**
     * Mock payment capture: no real gateway involved yet, this always succeeds. Only
     * rooms still PENDING get marked PAID (idempotent if called twice); a trip that's
     * entirely cancelled can't be paid for.
     */
    @Transactional
    public List<BookingDto> payGroup(Long groupId, String guestEmail) {
        BookingGroup group = findGroup(groupId);
        if (!guestEmail.equals(group.getGuestEmail())) {
            throw new ForbiddenException("You can only pay for your own trips");
        }
        return recordGroupPaymentInternal(groupId, "Online", null);
    }

    @Transactional
    public List<BookingDto> recordGroupPayment(Long groupId, String method, String reference) {
        findGroup(groupId);
        return recordGroupPaymentInternal(groupId, method, reference);
    }

    private List<BookingDto> recordGroupPaymentInternal(Long groupId, String method, String reference) {
        List<Booking> bookings = bookingRepository.findByBookingGroupId(groupId);
        if (bookings.stream().allMatch(b -> b.getStatus() == BookingStatus.CANCELLED)) {
            throw new IllegalArgumentException("Can't record payment for a cancelled trip");
        }
        return bookings.stream()
                .map(b -> {
                    if (b.getStatus() != BookingStatus.CANCELLED && b.getPaymentStatus() != PaymentStatus.PAID) {
                        b.markPaid(method, reference);
                        b = bookingRepository.save(b);
                    }
                    return toDto(b, propertyRepository.findById(b.getPropertyId()).orElse(null));
                })
                .toList();
    }

    @Transactional
    public BookingDto recordPayment(Long bookingId, String method, String reference) {
        Booking booking = findBooking(bookingId);
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new IllegalArgumentException("Can't record payment for a cancelled booking");
        }
        booking.markPaid(method, reference);
        Booking saved = bookingRepository.save(booking);
        return toDto(saved, propertyRepository.findById(saved.getPropertyId()).orElse(null));
    }

    private BookingGroup findGroup(Long groupId) {
        return bookingGroupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking group " + groupId + " not found"));
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
                b.getCheckIn(), b.getCheckOut(), b.getGuests(), b.getNotes(), b.getStatus(),
                b.getBookingGroupId(), b.getAmount(), b.getPaymentStatus(), b.getPaymentMethod(),
                b.getPaymentReference(), b.getChildrenCount(), b.getChildcareFee());
    }
}
