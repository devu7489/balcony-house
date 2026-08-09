package com.thebalconyhouse.backend.booking;

import com.thebalconyhouse.backend.booking.dto.CalendarDto;
import com.thebalconyhouse.backend.booking.dto.DashboardDto;
import com.thebalconyhouse.backend.booking.dto.GuestSummaryDto;
import com.thebalconyhouse.backend.property.Property;
import com.thebalconyhouse.backend.property.PropertyRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

/**
 * Read-only reporting for the admin panel - dashboard summary, availability calendar, and
 * guest directory. Deliberately separate from BookingService (which owns the booking
 * lifecycle and its payment-critical invariants): everything here is derived from data
 * BookingService already maintains, computed fresh on every call rather than cached, since
 * a boutique property's dataset is small enough that this is cheap.
 */
@Service
public class AdminInsightsService {

    private static final int MAX_CALENDAR_DAYS = 60;

    private final BookingRepository bookingRepository;
    private final PropertyRepository propertyRepository;
    private final PaymentRepository paymentRepository;
    private final RoomBlockRepository roomBlockRepository;
    private final ZoneId hotelZoneId;

    public AdminInsightsService(BookingRepository bookingRepository, PropertyRepository propertyRepository,
                                 PaymentRepository paymentRepository, RoomBlockRepository roomBlockRepository,
                                 @Value("${app.hotel.timezone}") String hotelTimezone) {
        this.bookingRepository = bookingRepository;
        this.propertyRepository = propertyRepository;
        this.paymentRepository = paymentRepository;
        this.roomBlockRepository = roomBlockRepository;
        this.hotelZoneId = ZoneId.of(hotelTimezone);
    }

    public DashboardDto dashboard() {
        LocalDate today = LocalDate.now(hotelZoneId);
        List<Property> properties = propertyRepository.findAll();
        int totalUnits = properties.stream().mapToInt(Property::getTotalUnits).sum();

        List<Booking> allBookings = bookingRepository.findAll();
        List<Booking> active = allBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.CHECKED_IN)
                .toList();

        long occupiedToday = active.stream()
                .filter(b -> !today.isBefore(b.getCheckIn()) && today.isBefore(b.getCheckOut()))
                .count();
        double occupancyPercent = totalUnits > 0 ? Math.round(occupiedToday * 1000.0 / totalUnits) / 10.0 : 0;

        Map<Long, BigDecimal> payableTotals = PayableTotals.forBookings(active);
        BigDecimal outstandingBalance = active.stream()
                .map(b -> payableTotals.get(b.getId()).subtract(b.getAmountPaid()))
                .filter(d -> d.signum() > 0)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long pendingPaymentsCount = active.stream().filter(b -> b.getPaymentStatus() == PaymentStatus.PENDING).count();

        Instant monthStart = today.withDayOfMonth(1).atStartOfDay(hotelZoneId).toInstant();
        BigDecimal revenueThisMonth = paymentRepository.findByPaidAtGreaterThanEqual(monthStart).stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long arrivalsToday = allBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED && b.getCheckIn().equals(today)).count();
        long departuresToday = allBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CHECKED_IN && b.getCheckOut().equals(today)).count();
        long arrivalsNext7Days = allBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED
                        && b.getCheckIn().isAfter(today) && !b.getCheckIn().isAfter(today.plusDays(7)))
                .count();

        return new DashboardDto(totalUnits, (int) occupiedToday, occupancyPercent, revenueThisMonth,
                outstandingBalance, pendingPaymentsCount, arrivalsToday, departuresToday, arrivalsNext7Days);
    }

    public CalendarDto calendar(int days) {
        int clampedDays = Math.max(1, Math.min(days, MAX_CALENDAR_DAYS));
        LocalDate start = LocalDate.now(hotelZoneId);
        LocalDate end = start.plusDays(clampedDays);
        List<LocalDate> dates = IntStream.range(0, clampedDays).mapToObj(start::plusDays).toList();

        List<Booking> overlapping = bookingRepository.findActiveOverlapping(start, end);
        List<RoomBlock> overlappingBlocks = roomBlockRepository.findActiveOverlapping(start, end);

        List<Property> properties = propertyRepository.findAll().stream()
                .sorted(Comparator.comparing(Property::getName)).toList();

        List<CalendarDto.CalendarRoomDto> rows = properties.stream().map(p -> {
            List<Integer> perDay = dates.stream().map(d -> {
                long bookedUnits = overlapping.stream()
                        .filter(b -> b.getPropertyId().equals(p.getId()) && !d.isBefore(b.getCheckIn()) && d.isBefore(b.getCheckOut()))
                        .count();
                long blockedUnits = overlappingBlocks.stream()
                        .filter(r -> r.getPropertyId().equals(p.getId()) && !d.isBefore(r.getStartDate()) && d.isBefore(r.getEndDate()))
                        .count();
                return (int) (bookedUnits + blockedUnits);
            }).toList();
            return new CalendarDto.CalendarRoomDto(p.getId(), p.getName(), p.getTotalUnits(), perDay);
        }).toList();

        return new CalendarDto(dates, rows);
    }

    public List<GuestSummaryDto> guestDirectory() {
        List<Booking> allBookings = bookingRepository.findAll();
        Map<String, List<Booking>> byEmail = allBookings.stream()
                .filter(b -> b.getGuestEmail() != null)
                .collect(Collectors.groupingBy(Booking::getGuestEmail));

        return byEmail.entrySet().stream().map(entry -> {
            String email = entry.getKey();
            List<Booking> bookings = entry.getValue();
            List<Booking> notCancelled = bookings.stream().filter(b -> b.getStatus() != BookingStatus.CANCELLED).toList();

            Booking mostRecent = bookings.stream()
                    .max(Comparator.comparing(Booking::getCreatedAt)).orElseThrow();

            long stayCount = notCancelled.stream()
                    .map(b -> b.getBookingGroupId() != null ? "G" + b.getBookingGroupId() : "B" + b.getId())
                    .distinct()
                    .count();

            BigDecimal totalSpend = notCancelled.stream()
                    .map(Booking::getAmountPaid)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            LocalDate lastCheckOut = notCancelled.stream()
                    .map(Booking::getCheckOut)
                    .max(Comparator.naturalOrder())
                    .orElse(null);

            return new GuestSummaryDto(email, mostRecent.getGuestName(), mostRecent.getGuestPhone(),
                    stayCount, totalSpend.setScale(2, RoundingMode.HALF_UP), lastCheckOut);
        })
        .filter(g -> g.stayCount() > 0)
        .sorted(Comparator.comparing(GuestSummaryDto::lastCheckOut, Comparator.nullsLast(Comparator.reverseOrder())))
        .toList();
    }
}
