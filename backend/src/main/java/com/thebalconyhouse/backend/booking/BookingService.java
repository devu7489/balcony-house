package com.thebalconyhouse.backend.booking;

import com.thebalconyhouse.backend.booking.dto.AdminBookingRequest;
import com.thebalconyhouse.backend.booking.dto.BookingDto;
import com.thebalconyhouse.backend.booking.dto.BookingGroupRequest;
import com.thebalconyhouse.backend.booking.dto.BookingRequest;
import com.thebalconyhouse.backend.booking.dto.GroupRoomSelection;
import com.thebalconyhouse.backend.booking.dto.PaymentRecordDto;
import com.thebalconyhouse.backend.booking.dto.TodayScheduleDto;
import com.thebalconyhouse.backend.addon.ChildcarePricing;
import com.thebalconyhouse.backend.addon.FullBoardPricing;
import com.thebalconyhouse.backend.addon.RoomPricing;
import com.thebalconyhouse.backend.common.ForbiddenException;
import com.thebalconyhouse.backend.common.ResourceNotFoundException;
import com.thebalconyhouse.backend.property.Property;
import com.thebalconyhouse.backend.property.PropertyRepository;
import com.thebalconyhouse.backend.property.dto.AvailabilityDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
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
    private final PaymentRepository paymentRepository;
    private final RoomPricing roomPricing;
    private final ChildcarePricing childcarePricing;
    private final FullBoardPricing fullBoardPricing;
    private final ZoneId hotelZoneId;

    public BookingService(BookingRepository bookingRepository, BookingGroupRepository bookingGroupRepository,
                           PropertyRepository propertyRepository, PaymentRepository paymentRepository,
                           RoomPricing roomPricing, ChildcarePricing childcarePricing, FullBoardPricing fullBoardPricing,
                           @Value("${app.hotel.timezone}") String hotelTimezone) {
        this.bookingRepository = bookingRepository;
        this.bookingGroupRepository = bookingGroupRepository;
        this.propertyRepository = propertyRepository;
        this.paymentRepository = paymentRepository;
        this.roomPricing = roomPricing;
        this.childcarePricing = childcarePricing;
        this.fullBoardPricing = fullBoardPricing;
        this.hotelZoneId = ZoneId.of(hotelTimezone);
    }

    /**
     * "Today" at the front desk, not on the server - the container/host can be running in
     * any timezone (UTC by default in Docker), but check-in/check-out gating and mid-stay
     * proration must follow wall-clock time at the property, not wherever the JVM happens
     * to sit. Using the JVM/system default here previously undercounted elapsed nights by
     * one for several hours around local midnight in timezones ahead of UTC (e.g. IST).
     */
    private LocalDate today() {
        return LocalDate.now(hotelZoneId);
    }

    public AvailabilityDto checkAvailability(Long propertyId, LocalDate checkIn, LocalDate checkOut) {
        Property property = findProperty(propertyId);
        int unitsLeft = unitsLeft(property, checkIn, checkOut);
        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);
        BigDecimal price = nights > 0 ? roomPricing.priceForStay(property, checkIn, nights) : property.getPricePerNight();
        return new AvailabilityDto(unitsLeft > 0, Math.max(unitsLeft, 0), price);
    }

    @Transactional
    public BookingDto create(BookingRequest request, String guestEmail, String guestName) {
        return createInternal(request.propertyId(), guestEmail, guestName, request.guestPhone(),
                request.checkIn(), request.checkOut(), request.guests(), request.notes(), null,
                PaymentStatus.PENDING, null, null, 0, false, 0, 0);
    }

    @Transactional
    public BookingDto createForAdmin(AdminBookingRequest request) {
        PaymentStatus paymentStatus = request.paymentReceived() ? PaymentStatus.PAID : PaymentStatus.PENDING;
        String paymentMethod = request.paymentReceived() ? request.paymentMethod() : null;
        String paymentReference = request.paymentReceived() ? request.paymentReference() : null;
        return createInternal(request.propertyId(), request.guestEmail(), request.guestName(), request.guestPhone(),
                request.checkIn(), request.checkOut(), request.guests(), request.notes(), null,
                paymentStatus, paymentMethod, paymentReference, request.childrenCount(),
                request.fullBoard(), request.guests(), request.discountPercent());
    }

    /**
     * Books every room in the request atomically: if any room fails validation (capacity,
     * guest count, availability - accounting for other rooms of the same type earlier in
     * this same request, not just what's already in the database), nothing is persisted.
     */
    @Transactional
    public List<BookingDto> createGroup(BookingGroupRequest request, String guestEmail, String guestName) {
        int maxChildren = request.rooms().size() * ChildcarePricing.MAX_CHILDREN_PER_ROOM;
        if (request.childrenCount() > maxChildren) {
            throw new IllegalArgumentException(
                    "Up to " + ChildcarePricing.MAX_CHILDREN_PER_ROOM + " kids per room - "
                            + maxChildren + " max for " + request.rooms().size() + " room(s)");
        }

        Map<Long, Integer> consumedInRequest = new HashMap<>();
        for (GroupRoomSelection selection : request.rooms()) {
            Property property = findProperty(selection.propertyId());
            validateRoom(property, request.checkIn(), request.checkOut(), selection.guests(),
                    consumedInRequest.getOrDefault(property.getId(), 0));
            consumedInRequest.merge(property.getId(), 1, Integer::sum);
        }

        BookingGroup group = bookingGroupRepository.save(new BookingGroup(guestEmail, guestName, request.guestPhone(),
                request.checkIn(), request.checkOut(), request.notes(), Instant.now()));

        int totalGuests = request.rooms().stream().mapToInt(GroupRoomSelection::guests).sum();

        return request.rooms().stream()
                .map(selection -> createInternal(selection.propertyId(), guestEmail, guestName, request.guestPhone(),
                        request.checkIn(), request.checkOut(), selection.guests(), request.notes(), group.getId(),
                        PaymentStatus.PENDING, null, null, request.childrenCount(),
                        request.fullBoard(), totalGuests, 0))
                .toList();
    }

    private BookingDto createInternal(Long propertyId, String guestEmail, String guestName, String guestPhone,
                                       LocalDate checkIn, LocalDate checkOut, int guests, String notes, Long bookingGroupId,
                                       PaymentStatus initialPaymentStatus, String paymentMethod, String paymentReference,
                                       int childrenCount, boolean fullBoard, int totalGuestsForFullBoard, int discountPercent) {
        Property property = findProperty(propertyId);
        validateRoom(property, checkIn, checkOut, guests, 0);

        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);
        BigDecimal amount = computeAmount(property, checkIn, nights);
        BigDecimal childcareFee = childcarePricing.totalPerChild(nights).multiply(BigDecimal.valueOf(childrenCount));
        BigDecimal fullBoardFee = fullBoard
                ? fullBoardPricing.getPricePerPersonPerDay().multiply(BigDecimal.valueOf(totalGuestsForFullBoard)).multiply(BigDecimal.valueOf(nights))
                : BigDecimal.ZERO;
        BigDecimal discountAmount = amount.add(childcareFee).add(fullBoardFee)
                .multiply(BigDecimal.valueOf(discountPercent)).divide(BigDecimal.valueOf(100));

        Booking booking = new Booking(property.getId(), guestEmail, guestName, guestPhone,
                checkIn, checkOut, guests, notes, Instant.now());
        booking.setBookingGroupId(bookingGroupId);
        booking.setAmount(amount);
        booking.setChildcare(childrenCount, childcareFee);
        booking.setFullBoard(fullBoard, fullBoardFee);
        booking.setDiscount(discountPercent, discountAmount);
        booking.setInitialPayment(initialPaymentStatus, paymentMethod, paymentReference);
        Booking saved = bookingRepository.save(booking);
        // Must come after the addon setters above and the initial save (needs the booking's
        // id) - records an itemized Payment row for the full total so a booking created
        // already-paid (e.g. an admin phone booking) has correct payment history from day one.
        if (initialPaymentStatus == PaymentStatus.PAID) {
            saved = recordPaymentInternal(saved, null, paymentMethod, paymentReference);
        }
        return toDto(saved, property);
    }

    private BigDecimal computeAmount(Property property, LocalDate checkIn, long nights) {
        return roomPricing.priceForStay(property, checkIn, nights).multiply(BigDecimal.valueOf(nights));
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
        return enrich(bookingRepository.findByGuestEmailOrderByCreatedAtDesc(guestEmail));
    }

    public List<BookingDto> findAll() {
        return enrich(bookingRepository.findAllByOrderByCreatedAtDesc());
    }

    @Transactional
    public BookingDto checkIn(Long bookingId) {
        Booking booking = findBooking(bookingId);
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new IllegalArgumentException("Only confirmed bookings can be checked in");
        }
        if (booking.getRoomNumber() == null || booking.getRoomNumber().isBlank()) {
            throw new IllegalArgumentException("Assign a room number before checking in");
        }
        if (today().isBefore(booking.getCheckIn())) {
            throw new IllegalArgumentException("Check-in isn't allowed before the scheduled arrival date (" + booking.getCheckIn() + ")");
        }
        return transitionTo(booking, BookingStatus.CHECKED_IN);
    }

    /**
     * Moves a not-yet-checked-in booking to a different room category, recomputing its
     * room amount for the new type. If it was already marked PAID, that mark no longer
     * reflects the new total, so it's reset to PENDING - the front desk records a fresh
     * payment for the corrected amount (this app has no partial-payment ledger).
     */
    @Transactional
    public BookingDto upgradeRoom(Long bookingId, Long newPropertyId) {
        Booking booking = findBooking(bookingId);
        if (booking.getStatus() != BookingStatus.CONFIRMED && booking.getStatus() != BookingStatus.CHECKED_IN) {
            throw new IllegalArgumentException("Only confirmed or checked-in bookings can change rooms");
        }
        if (newPropertyId.equals(booking.getPropertyId())) {
            throw new IllegalArgumentException("Already booked in this room type");
        }
        Property newProperty = findProperty(newPropertyId);
        if (unitsLeft(newProperty, booking.getCheckIn(), booking.getCheckOut()) <= 0) {
            throw new RoomUnavailableException("No rooms of this type are available for the selected dates");
        }
        if (booking.getGuests() > newProperty.getMaxGuests()) {
            throw new IllegalArgumentException("This room sleeps at most " + newProperty.getMaxGuests() + " guests");
        }

        // Nights already spent bill at the old room's rate; only the remaining nights move
        // to the new room's rate - correct whether this is a same-day pre-arrival swap
        // (elapsedNights resolves to 0) or a genuine mid-stay room change.
        long totalNights = ChronoUnit.DAYS.between(booking.getCheckIn(), booking.getCheckOut());
        long elapsedNights = ChronoUnit.DAYS.between(booking.getCheckIn(), today());
        BigDecimal newPerNightRate = roomPricing.priceForStay(newProperty, booking.getCheckIn(), totalNights);
        BigDecimal newAmount = RoomPricing.proratedAmount(booking.getAmount(), totalNights, elapsedNights, newPerNightRate);

        booking.setPropertyId(newProperty.getId());
        booking.setAmount(newAmount);
        booking.setRoomNumber(null);
        if (booking.getPaymentStatus() == PaymentStatus.PAID) {
            // Only flips the status - amountPaid/method/reference are left as-is, so the
            // front desk still sees exactly how much was already collected (see
            // Booking.setPaymentStatus's own comment for why this matters).
            booking.setPaymentStatus(PaymentStatus.PENDING);
        }
        Booking saved = bookingRepository.save(booking);
        return toDto(saved, newProperty);
    }

    @Transactional
    public BookingDto checkOut(Long bookingId) {
        Booking booking = findBooking(bookingId);
        if (booking.getStatus() != BookingStatus.CHECKED_IN) {
            throw new IllegalArgumentException("Only checked-in bookings can be checked out");
        }
        if (today().isBefore(booking.getCheckOut())) {
            throw new IllegalArgumentException("Check-out isn't allowed before the scheduled departure date (" + booking.getCheckOut() + ")");
        }
        if (booking.getPaymentStatus() != PaymentStatus.PAID) {
            throw new IllegalArgumentException("Record payment before checking this booking out");
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
        return enrich(bookingRepository.findByBookingGroupIdOrderByIdAsc(groupId));
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
        List<Booking> bookings = bookingRepository.findByBookingGroupIdOrderByIdAsc(groupId);
        boolean anyMissingRoom = bookings.stream()
                .anyMatch(b -> b.getStatus() == BookingStatus.CONFIRMED
                        && (b.getRoomNumber() == null || b.getRoomNumber().isBlank()));
        if (anyMissingRoom) {
            throw new IllegalArgumentException("Assign a room number to every room before checking in the trip");
        }
        LocalDate today = today();
        boolean anyTooEarly = bookings.stream()
                .anyMatch(b -> b.getStatus() == BookingStatus.CONFIRMED && today.isBefore(b.getCheckIn()));
        if (anyTooEarly) {
            throw new IllegalArgumentException("Check-in isn't allowed before the scheduled arrival date");
        }
        return bookings.stream()
                .map(b -> b.getStatus() == BookingStatus.CONFIRMED
                        ? transitionTo(b, BookingStatus.CHECKED_IN)
                        : toDto(b, propertyRepository.findById(b.getPropertyId()).orElse(null)))
                .toList();
    }

    @Transactional
    public List<BookingDto> checkOutGroup(Long groupId) {
        findGroup(groupId);
        List<Booking> bookings = bookingRepository.findByBookingGroupIdOrderByIdAsc(groupId);
        LocalDate today = today();
        boolean anyTooEarly = bookings.stream()
                .anyMatch(b -> b.getStatus() == BookingStatus.CHECKED_IN && today.isBefore(b.getCheckOut()));
        if (anyTooEarly) {
            throw new IllegalArgumentException("Check-out isn't allowed before the scheduled departure date for every room in the trip");
        }
        boolean anyUnpaid = bookings.stream()
                .anyMatch(b -> b.getStatus() == BookingStatus.CHECKED_IN && b.getPaymentStatus() != PaymentStatus.PAID);
        if (anyUnpaid) {
            throw new IllegalArgumentException("Record payment for the whole trip before checking out");
        }
        return bookings.stream()
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
        return bookingRepository.findByBookingGroupIdOrderByIdAsc(groupId).stream()
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
        return recordGroupPaymentInternal(groupId, null, "Online", null);
    }

    @Transactional
    public List<BookingDto> recordGroupPayment(Long groupId, BigDecimal amount, String method, String reference) {
        findGroup(groupId);
        return recordGroupPaymentInternal(groupId, amount, method, reference);
    }

    /**
     * amount == null means "pay everything still due, across every unpaid room" (the
     * original one-click behaviour). An explicit amount is applied room by room, in id
     * order, until it's used up - so a partial trip payment settles the earliest rooms
     * first rather than being silently rejected or split evenly.
     */
    private List<BookingDto> recordGroupPaymentInternal(Long groupId, BigDecimal amount, String method, String reference) {
        List<Booking> bookings = bookingRepository.findByBookingGroupIdOrderByIdAsc(groupId);
        if (bookings.stream().allMatch(b -> b.getStatus() == BookingStatus.CANCELLED)) {
            throw new IllegalArgumentException("Can't record payment for a cancelled trip");
        }
        BigDecimal remaining = amount;
        for (Booking b : bookings) {
            if (b.getStatus() == BookingStatus.CANCELLED || b.getPaymentStatus() == PaymentStatus.PAID) continue;
            BigDecimal due = payableTotal(b, isFirstInGroup(b, bookings)).subtract(b.getAmountPaid());
            if (due.signum() <= 0) continue;
            BigDecimal thisPayment = remaining == null ? due : remaining.min(due);
            if (thisPayment.signum() <= 0) continue;
            recordPaymentInternal(b, thisPayment, method, reference);
            if (remaining != null) {
                remaining = remaining.subtract(thisPayment);
            }
        }
        return bookingRepository.findByBookingGroupIdOrderByIdAsc(groupId).stream()
                .map(b -> toDto(b, propertyRepository.findById(b.getPropertyId()).orElse(null)))
                .toList();
    }

    @Transactional
    public BookingDto recordPayment(Long bookingId, BigDecimal amount, String method, String reference) {
        Booking booking = findBooking(bookingId);
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new IllegalArgumentException("Can't record payment for a cancelled booking");
        }
        Booking saved = recordPaymentInternal(booking, amount, method, reference);
        return toDto(saved, propertyRepository.findById(saved.getPropertyId()).orElse(null));
    }

    /**
     * Records one itemized Payment row and rolls it into the booking's running amountPaid/
     * paymentStatus - this is the single place a payment is ever recorded, so "how much was
     * paid, when, and by what method" is never overwritten or lost (see Payment's own
     * comment for why that matters - it's what an invoice needs).
     * amount == null means "whatever's still due right now".
     */
    private Booking recordPaymentInternal(Booking booking, BigDecimal amount, String method, String reference) {
        BigDecimal owed = payableTotal(booking);
        BigDecimal due = owed.subtract(booking.getAmountPaid());
        BigDecimal amountToRecord = amount != null ? amount : due;
        paymentRepository.save(new Payment(booking.getId(), amountToRecord, method, reference, Instant.now()));

        BigDecimal totalPaid = paymentRepository.findByBookingIdOrderByPaidAtAsc(booking.getId()).stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        booking.setAmountPaid(totalPaid);
        booking.setPaymentMethod(method);
        booking.setPaymentReference(reference);
        booking.setPaymentStatus(totalPaid.compareTo(owed) >= 0 ? PaymentStatus.PAID : PaymentStatus.PENDING);
        return bookingRepository.save(booking);
    }

    /**
     * Childcare and Full Board fees are trip-wide totals denormalized onto every booking row
     * in the group (see Booking.childcareFee's own comment) - so naively summing amount +
     * childcareFee + fullBoardFee per booking (Booking.getFullTotal()) double-counts the
     * shared addon cost once per room in a multi-room trip. Only the group's first room (by
     * id) is treated as carrying that shared cost for payment purposes; every other room is
     * responsible only for its own room amount minus its own discount. A booking with no
     * group has nothing to share, so its full total is already correct as-is.
     */
    private BigDecimal payableTotal(Booking booking) {
        if (booking.getBookingGroupId() == null) {
            return booking.getFullTotal();
        }
        List<Booking> siblings = bookingRepository.findByBookingGroupIdOrderByIdAsc(booking.getBookingGroupId());
        return payableTotal(booking, isFirstInGroup(booking, siblings));
    }

    private BigDecimal payableTotal(Booking booking, boolean isAddonBearer) {
        if (booking.getBookingGroupId() == null || isAddonBearer) {
            return booking.getFullTotal();
        }
        return booking.getAmount().subtract(booking.getDiscountAmount());
    }

    private boolean isFirstInGroup(Booking booking, List<Booking> groupSiblings) {
        return !groupSiblings.isEmpty() && groupSiblings.get(0).getId().equals(booking.getId());
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
        List<Long> bookingIds = bookings.stream().map(Booking::getId).toList();
        Map<Long, List<Payment>> paymentsByBooking = paymentRepository.findByBookingIdInOrderByPaidAtAsc(bookingIds).stream()
                .collect(java.util.stream.Collectors.groupingBy(Payment::getBookingId));
        // Every sibling of any group present here is guaranteed to also be present in
        // `bookings` (findAll/findMine/findByGroupId all return whole groups, never a
        // partial slice of one), so the addon-bearer can be worked out in memory - no
        // extra per-booking query needed the way payableTotal(Booking) alone would do.
        Map<Long, Long> firstIdByGroup = bookings.stream()
                .filter(b -> b.getBookingGroupId() != null)
                .collect(java.util.stream.Collectors.groupingBy(Booking::getBookingGroupId,
                        java.util.stream.Collectors.mapping(Booking::getId, java.util.stream.Collectors.minBy(Long::compareTo))))
                .entrySet().stream()
                .collect(java.util.stream.Collectors.toMap(Map.Entry::getKey, e -> e.getValue().orElseThrow()));
        return bookings.stream()
                .map(b -> {
                    boolean isAddonBearer = b.getBookingGroupId() == null || b.getId().equals(firstIdByGroup.get(b.getBookingGroupId()));
                    return toDto(b, propertiesById.get(b.getPropertyId()), paymentsByBooking.getOrDefault(b.getId(), List.of()), isAddonBearer);
                })
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
        boolean isAddonBearer = b.getBookingGroupId() == null
                || isFirstInGroup(b, bookingRepository.findByBookingGroupIdOrderByIdAsc(b.getBookingGroupId()));
        return toDto(b, property, paymentRepository.findByBookingIdOrderByPaidAtAsc(b.getId()), isAddonBearer);
    }

    private BookingDto toDto(Booking b, Property property, List<Payment> payments, boolean isAddonBearer) {
        List<PaymentRecordDto> paymentDtos = payments.stream()
                .map(p -> new PaymentRecordDto(p.getId(), p.getBookingId(), p.getAmount(), p.getMethod(), p.getReference(), p.getPaidAt()))
                .toList();
        return new BookingDto(b.getId(), b.getPropertyId(),
                property != null ? property.getName() : null,
                property != null ? property.getHeroImageUrl() : null,
                b.getGuestEmail(), b.getGuestName(), b.getGuestPhone(),
                b.getCheckIn(), b.getCheckOut(), b.getGuests(), b.getNotes(), b.getStatus(),
                b.getBookingGroupId(), b.getCreatedAt(), b.getRoomNumber(), b.getAmount(), b.getPaymentStatus(), b.getPaymentMethod(),
                b.getPaymentReference(), b.getAmountPaid(), paymentDtos, b.getChildrenCount(), b.getChildcareFee(),
                b.isFullBoard(), b.getFullBoardFee(), b.getDiscountPercent(), b.getDiscountAmount(),
                payableTotal(b, isAddonBearer));
    }

    @Transactional
    public BookingDto setRoomNumber(Long bookingId, String roomNumber) {
        Booking booking = findBooking(bookingId);
        if (booking.getStatus() == BookingStatus.CHECKED_OUT || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new IllegalArgumentException("Can't change the room assignment after checkout or cancellation");
        }
        String normalized = roomNumber == null || roomNumber.isBlank() ? null : roomNumber.trim();
        if (normalized != null) {
            List<Booking> conflicts = bookingRepository.findConflictingRoomNumber(
                    normalized, bookingId, booking.getCheckIn(), booking.getCheckOut());
            if (!conflicts.isEmpty()) {
                throw new IllegalArgumentException(
                        "Room " + normalized + " is already assigned to another booking for overlapping dates");
            }
        }
        booking.setRoomNumber(normalized);
        Booking saved = bookingRepository.save(booking);
        return toDto(saved, propertyRepository.findById(saved.getPropertyId()).orElse(null));
    }

    /**
     * Today's front-desk view: who's arriving and who's leaving today, for active
     * (non-cancelled) bookings only - a completed or cancelled stay isn't actionable.
     */
    public TodayScheduleDto findTodaySchedule() {
        LocalDate today = today();
        List<BookingDto> arrivals = enrich(bookingRepository.findArrivals(today, BookingStatus.CONFIRMED));
        List<BookingDto> departures = enrich(bookingRepository.findDepartures(today, BookingStatus.CHECKED_IN));
        return new TodayScheduleDto(arrivals, departures);
    }
}
