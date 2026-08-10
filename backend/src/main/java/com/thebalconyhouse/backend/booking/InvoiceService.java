package com.thebalconyhouse.backend.booking;

import com.thebalconyhouse.backend.addon.GstSplit;
import com.thebalconyhouse.backend.booking.dto.InvoiceDto;
import com.thebalconyhouse.backend.booking.dto.InvoiceLineDto;
import com.thebalconyhouse.backend.booking.dto.PaymentRecordDto;
import com.thebalconyhouse.backend.common.ForbiddenException;
import com.thebalconyhouse.backend.common.ResourceNotFoundException;
import com.thebalconyhouse.backend.hotel.HotelConfig;
import com.thebalconyhouse.backend.property.Property;
import com.thebalconyhouse.backend.property.PropertyRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Builds and persists the one invoice per trip (or standalone booking) - see Invoice's own
 * comment for why generation is idempotent rather than recomputed every time the page loads.
 */
@Service
@Transactional(readOnly = true)
public class InvoiceService {

    private final BookingRepository bookingRepository;
    private final PropertyRepository propertyRepository;
    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final HotelConfig hotelConfig;
    private final ZoneId hotelZoneId;

    public InvoiceService(BookingRepository bookingRepository, PropertyRepository propertyRepository,
                           PaymentRepository paymentRepository, InvoiceRepository invoiceRepository,
                           HotelConfig hotelConfig, @Value("${app.hotel.timezone}") String hotelTimezone) {
        this.bookingRepository = bookingRepository;
        this.propertyRepository = propertyRepository;
        this.paymentRepository = paymentRepository;
        this.invoiceRepository = invoiceRepository;
        this.hotelConfig = hotelConfig;
        this.hotelZoneId = ZoneId.of(hotelTimezone);
    }

    @Transactional
    public InvoiceDto forBooking(Long bookingId) {
        Booking booking = findBooking(bookingId);
        if (booking.getBookingGroupId() != null) {
            return forGroup(booking.getBookingGroupId());
        }
        return generate(List.of(booking), null, bookingId);
    }

    @Transactional
    public InvoiceDto forOwnBooking(Long bookingId, String guestEmail) {
        Booking booking = findBooking(bookingId);
        if (!guestEmail.equals(booking.getGuestEmail())) {
            throw new ForbiddenException("You can only view your own invoice");
        }
        return forBooking(bookingId);
    }

    @Transactional
    public InvoiceDto forGroup(Long groupId) {
        List<Booking> bookings = bookingRepository.findByBookingGroupIdOrderByIdAsc(groupId);
        if (bookings.isEmpty()) {
            throw new ResourceNotFoundException("Booking group " + groupId + " not found");
        }
        return generate(bookings, groupId, null);
    }

    @Transactional
    public InvoiceDto forOwnGroup(Long groupId, String guestEmail) {
        List<Booking> bookings = bookingRepository.findByBookingGroupIdOrderByIdAsc(groupId);
        if (bookings.isEmpty()) {
            throw new ResourceNotFoundException("Booking group " + groupId + " not found");
        }
        if (bookings.stream().noneMatch(b -> guestEmail.equals(b.getGuestEmail()))) {
            throw new ForbiddenException("You can only view your own invoice");
        }
        return generate(bookings, groupId, null);
    }

    /**
     * amount/childcareFee/fullBoardFee/discountAmount already reflect exactly what the guest
     * was charged and paid (see BookingService.payableTotal for how the shared trip-wide
     * addon fees are attributed to just one room to avoid double counting) - this only
     * re-derives the GST split from that total, it never adds anything on top of it.
     */
    private InvoiceDto generate(List<Booking> bookings, Long groupId, Long bookingId) {
        List<Booking> active = bookings.stream().filter(b -> b.getStatus() != BookingStatus.CANCELLED).toList();
        if (active.isEmpty()) {
            throw new IllegalArgumentException("Can't generate an invoice for a cancelled booking");
        }
        boolean allPaid = active.stream().allMatch(b -> b.getPaymentStatus() == PaymentStatus.PAID);
        if (!allPaid) {
            throw new IllegalArgumentException("Record full payment before generating an invoice");
        }

        Optional<Invoice> existing = groupId != null
                ? invoiceRepository.findByBookingGroupId(groupId)
                : invoiceRepository.findByBookingId(bookingId);
        Invoice invoice = existing.orElseGet(() -> createAndPersist(active, groupId, bookingId));
        return toDto(invoice, bookings);
    }

    private Invoice createAndPersist(List<Booking> active, Long groupId, Long bookingId) {
        BigDecimal totalCollected = active.stream()
                .map(Booking::getAmountPaid)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        HotelConfig.Gst gst = hotelConfig.gst();
        BigDecimal ratePercent = gst != null && gst.enabled() && gst.ratePercent() != null ? gst.ratePercent() : BigDecimal.ZERO;

        GstSplit.Result split = GstSplit.of(totalCollected, ratePercent);

        Booking first = active.get(0);
        Instant now = Instant.now();
        Invoice invoice = new Invoice(nextInvoiceNumber(now), groupId, bookingId, first.getGuestName(), first.getGuestEmail(),
                split.taxableValue(), ratePercent, split.cgst(), split.sgst(), totalCollected, now);
        return invoiceRepository.save(invoice);
    }

    private String nextInvoiceNumber(Instant generatedAt) {
        LocalDate local = generatedAt.atZone(hotelZoneId).toLocalDate();
        int fyStartYear = local.getMonthValue() >= 4 ? local.getYear() : local.getYear() - 1;
        String fyLabel = fyStartYear + "-" + String.format("%02d", (fyStartYear + 1) % 100);
        long seq = invoiceRepository.count() + 1;
        return String.format("INV-%s-%05d", fyLabel, seq);
    }

    private InvoiceDto toDto(Invoice invoice, List<Booking> bookings) {
        List<Long> propertyIds = bookings.stream().map(Booking::getPropertyId).distinct().toList();
        var propertiesById = propertyRepository.findAllById(propertyIds).stream()
                .collect(Collectors.toMap(Property::getId, p -> p));

        List<InvoiceLineDto> lines = new ArrayList<>();
        Booking any = bookings.get(0);
        long nights = ChronoUnit.DAYS.between(any.getCheckIn(), any.getCheckOut());
        for (Booking b : bookings) {
            if (b.getStatus() == BookingStatus.CANCELLED) continue;
            Property property = propertiesById.get(b.getPropertyId());
            String roomLabel = property != null ? property.getName() : ("Room #" + b.getPropertyId());
            if (b.getRoomNumber() != null && !b.getRoomNumber().isBlank()) {
                roomLabel += " (" + b.getRoomNumber() + ")";
            }
            lines.add(new InvoiceLineDto(roomLabel + " · " + nights + " night" + (nights == 1 ? "" : "s"), b.getAmount()));
        }
        Booking addonSource = bookings.stream().filter(b -> b.getStatus() != BookingStatus.CANCELLED).findFirst().orElse(any);
        if (addonSource.getChildrenCount() > 0 && addonSource.getChildcareFee() != null && addonSource.getChildcareFee().signum() > 0) {
            lines.add(new InvoiceLineDto("Kids Play Zone · " + addonSource.getChildrenCount()
                    + " child" + (addonSource.getChildrenCount() == 1 ? "" : "ren") + " · " + addonSource.getChildcareSessions()
                    + " session" + (addonSource.getChildcareSessions() == 1 ? "" : "s"), addonSource.getChildcareFee()));
        }
        if (addonSource.isFullBoard() && addonSource.getFullBoardFee() != null && addonSource.getFullBoardFee().signum() > 0) {
            lines.add(new InvoiceLineDto("Full Board · " + addonSource.getBuffetSessions()
                    + " buffet session" + (addonSource.getBuffetSessions() == 1 ? "" : "s"), addonSource.getFullBoardFee()));
        }
        if (addonSource.getFoodOrdersFee() != null && addonSource.getFoodOrdersFee().signum() > 0) {
            lines.add(new InvoiceLineDto("In-Room Dining", addonSource.getFoodOrdersFee()));
        }
        BigDecimal totalDiscount = bookings.stream()
                .filter(b -> b.getStatus() != BookingStatus.CANCELLED && b.getDiscountAmount() != null)
                .map(Booking::getDiscountAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (totalDiscount.signum() > 0) {
            lines.add(new InvoiceLineDto("Discount", totalDiscount.negate()));
        }

        List<Long> bookingIds = bookings.stream().map(Booking::getId).toList();
        List<PaymentRecordDto> payments = paymentRepository.findByBookingIdInOrderByPaidAtAsc(bookingIds).stream()
                .map(p -> new PaymentRecordDto(p.getId(), p.getBookingId(), p.getAmount(), p.getMethod(), p.getReference(), p.getPaidAt()))
                .toList();

        HotelConfig.Gst gst = hotelConfig.gst();
        String legalName = gst != null && gst.legalName() != null && !gst.legalName().isBlank() ? gst.legalName() : hotelConfig.name();

        return new InvoiceDto(
                invoice.getInvoiceNumber(), invoice.getGeneratedAt(),
                hotelConfig.name(), legalName,
                gst != null ? gst.gstin() : null,
                hotelConfig.contact() != null ? hotelConfig.contact().address() : null,
                gst != null ? gst.stateName() : null,
                gst != null ? gst.hsnCode() : null,
                hotelConfig.contact() != null ? hotelConfig.contact().email() : null,
                hotelConfig.contact() != null ? hotelConfig.contact().phone() : null,
                gst != null && gst.enabled(),
                any.getGuestName(), any.getGuestEmail(), any.getGuestPhone(),
                any.getCheckIn(), any.getCheckOut(), nights,
                lines, invoice.getTaxableValue(), invoice.getGstRatePercent(),
                invoice.getCgstAmount(), invoice.getSgstAmount(), invoice.getTotalAmount(),
                payments
        );
    }

    private Booking findBooking(Long bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking " + bookingId + " not found"));
    }
}
