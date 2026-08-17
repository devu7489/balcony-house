package com.thebalconyhouse.backend.booking;

import com.thebalconyhouse.backend.booking.dto.DailyCollectionDto;
import com.thebalconyhouse.backend.property.Property;
import com.thebalconyhouse.backend.property.PropertyRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

/**
 * Plain CSV export for handing numbers to an accountant/CA - no library, just a small
 * hand-rolled writer, since the format is simple and a dependency would be overkill.
 */
@Service
public class ReportService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final PropertyRepository propertyRepository;
    private final ZoneId hotelZoneId;

    public ReportService(PaymentRepository paymentRepository, BookingRepository bookingRepository,
                          PropertyRepository propertyRepository, @Value("${app.hotel.timezone}") String hotelTimezone) {
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
        this.propertyRepository = propertyRepository;
        this.hotelZoneId = ZoneId.of(hotelTimezone);
    }

    public String paymentsCsv(LocalDate from, LocalDate to) {
        Instant start = from.atStartOfDay(hotelZoneId).toInstant();
        Instant end = to.plusDays(1).atStartOfDay(hotelZoneId).toInstant();
        List<Payment> payments = paymentRepository.findByPaidAtBetweenOrderByPaidAtAsc(start, end);

        List<Long> bookingIds = payments.stream().map(Payment::getBookingId).distinct().toList();
        Map<Long, Booking> bookingsById = bookingRepository.findAllById(bookingIds).stream()
                .collect(Collectors.toMap(Booking::getId, b -> b));
        Map<Long, Property> propertiesById = propertyRepository.findAllById(
                bookingsById.values().stream().map(Booking::getPropertyId).distinct().toList()
        ).stream().collect(Collectors.toMap(Property::getId, p -> p));

        StringBuilder sb = new StringBuilder();
        sb.append("Date,Time,Booking ID,Guest Name,Guest Email,Room,Amount,Type,Method,Reference\n");
        for (Payment p : payments) {
            Booking b = bookingsById.get(p.getBookingId());
            Property property = b != null ? propertiesById.get(b.getPropertyId()) : null;
            boolean isRefund = p.getAmount().signum() < 0;
            var local = p.getPaidAt().atZone(hotelZoneId);
            row(sb,
                    local.format(DATE_FMT),
                    local.format(TIME_FMT),
                    String.valueOf(p.getBookingId()),
                    b != null ? b.getGuestName() : "",
                    b != null ? b.getGuestEmail() : "",
                    property != null ? property.getName() : "",
                    p.getAmount().abs().toPlainString(),
                    isRefund ? "Refund" : "Payment",
                    p.getMethod(),
                    p.getReference()
            );
        }
        return sb.toString();
    }

    /**
     * One entry per calendar day in [from, to] (inclusive, hotel-local), even days with no
     * payments - so "each day" callers get a complete, gap-free series rather than having to
     * infer zeros from missing dates. Refunds are negative Payment amounts and net directly
     * into the method/day they were paid against, so a day that was fully refunded nets to
     * zero rather than double-counting.
     */
    public List<DailyCollectionDto> dailyCollections(LocalDate from, LocalDate to) {
        Instant start = from.atStartOfDay(hotelZoneId).toInstant();
        Instant end = to.plusDays(1).atStartOfDay(hotelZoneId).toInstant();
        List<Payment> payments = paymentRepository.findByPaidAtBetweenOrderByPaidAtAsc(start, end);

        Map<LocalDate, Map<String, BigDecimal>> byMethodPerDay = new TreeMap<>();
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            byMethodPerDay.put(d, new LinkedHashMap<>());
        }
        for (Payment p : payments) {
            LocalDate day = p.getPaidAt().atZone(hotelZoneId).toLocalDate();
            byMethodPerDay.get(day).merge(p.getMethod(), p.getAmount(), BigDecimal::add);
        }

        return byMethodPerDay.entrySet().stream()
                .map(e -> new DailyCollectionDto(e.getKey(), e.getValue(),
                        e.getValue().values().stream().reduce(BigDecimal.ZERO, BigDecimal::add)))
                .toList();
    }

    public DailyCollectionDto todayCollection() {
        LocalDate today = LocalDate.now(hotelZoneId);
        return dailyCollections(today, today).get(0);
    }

    public String bookingsCsv(LocalDate from, LocalDate to) {
        List<Booking> bookings = bookingRepository.findAll().stream()
                .filter(b -> !b.getCheckIn().isBefore(from) && !b.getCheckIn().isAfter(to))
                .sorted((a, c) -> a.getCheckIn().compareTo(c.getCheckIn()))
                .toList();
        Map<Long, Property> propertiesById = propertyRepository.findAllById(
                bookings.stream().map(Booking::getPropertyId).distinct().toList()
        ).stream().collect(Collectors.toMap(Property::getId, p -> p));
        Map<Long, java.math.BigDecimal> payableTotals = PayableTotals.forBookings(bookings);

        StringBuilder sb = new StringBuilder();
        sb.append("Booking ID,Guest Name,Guest Email,Guest Phone,Room,Check-in,Check-out,Status,Cancellation Type,Payment Status," +
                "Room Amount,Childcare Fee,Full Board Fee,Discount,Payable Total,Amount Paid\n");
        for (Booking b : bookings) {
            Property property = propertiesById.get(b.getPropertyId());
            row(sb,
                    String.valueOf(b.getId()),
                    b.getGuestName(),
                    b.getGuestEmail(),
                    b.getGuestPhone(),
                    property != null ? property.getName() : "",
                    b.getCheckIn().format(DATE_FMT),
                    b.getCheckOut().format(DATE_FMT),
                    b.getStatus().name(),
                    b.getCancellationType() != null ? b.getCancellationType().name() : "",
                    b.getPaymentStatus().name(),
                    b.getAmount() != null ? b.getAmount().toPlainString() : "0",
                    b.getChildcareFee() != null ? b.getChildcareFee().toPlainString() : "0",
                    b.getFullBoardFee() != null ? b.getFullBoardFee().toPlainString() : "0",
                    b.getDiscountAmount() != null ? b.getDiscountAmount().toPlainString() : "0",
                    payableTotals.get(b.getId()).toPlainString(),
                    b.getAmountPaid().toPlainString()
            );
        }
        return sb.toString();
    }

    private static void row(StringBuilder sb, String... fields) {
        for (int i = 0; i < fields.length; i++) {
            if (i > 0) sb.append(',');
            sb.append(escape(fields[i]));
        }
        sb.append('\n');
    }

    private static String escape(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
