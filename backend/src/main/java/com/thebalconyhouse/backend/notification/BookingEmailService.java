package com.thebalconyhouse.backend.notification;

import com.thebalconyhouse.backend.booking.BookingStatus;
import com.thebalconyhouse.backend.booking.dto.BookingDto;
import com.thebalconyhouse.backend.hotel.HotelConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

/**
 * Builds the guest-facing confirmation/cancellation emails and hands them to EmailService.
 * Takes the full list of rooms for a trip (or a single-element list for a standalone
 * booking) so a multi-room trip reads as one email, not one per room. Every public method
 * here is a best-effort notification - see EmailService for why nothing here can throw.
 */
@Service
public class BookingEmailService {

    private static final Logger log = LoggerFactory.getLogger(BookingEmailService.class);

    private final EmailService emailService;
    private final HotelConfig hotelConfig;

    public BookingEmailService(EmailService emailService, HotelConfig hotelConfig) {
        this.emailService = emailService;
        this.hotelConfig = hotelConfig;
    }

    public void sendConfirmation(List<BookingDto> bookings) {
        try {
            if (bookings == null || bookings.isEmpty()) return;
            BookingDto first = bookings.get(0);
            String subject = hotelConfig.name() + " — Booking Confirmed (" + first.checkIn() + " to " + first.checkOut() + ")";
            emailService.send(first.guestEmail(), subject, confirmationHtml(bookings));
        } catch (Exception e) {
            log.warn("Failed to build confirmation email: {}", e.getMessage());
        }
    }

    public void sendCancellation(List<BookingDto> bookings) {
        try {
            if (bookings == null || bookings.isEmpty()) return;
            BookingDto first = bookings.get(0);
            String subject = hotelConfig.name() + " — Booking Cancelled";
            emailService.send(first.guestEmail(), subject, cancellationHtml(bookings));
        } catch (Exception e) {
            log.warn("Failed to build cancellation email: {}", e.getMessage());
        }
    }

    private String confirmationHtml(List<BookingDto> bookings) {
        BookingDto first = bookings.get(0);
        long nights = java.time.temporal.ChronoUnit.DAYS.between(first.checkIn(), first.checkOut());

        StringBuilder rooms = new StringBuilder();
        BigDecimal total = BigDecimal.ZERO;
        BigDecimal paid = BigDecimal.ZERO;
        for (BookingDto b : bookings) {
            if (b.status() == BookingStatus.CANCELLED) continue;
            rooms.append(row(b.propertyName() + (b.roomNumber() != null ? " (" + b.roomNumber() + ")" : ""), money(b.amount())));
            total = total.add(b.payableTotal() != null ? b.payableTotal() : BigDecimal.ZERO);
            paid = paid.add(b.amountPaid() != null ? b.amountPaid() : BigDecimal.ZERO);
        }
        BookingDto addonSource = bookings.stream().filter(b -> b.status() != BookingStatus.CANCELLED).findFirst().orElse(first);
        if (addonSource.childrenCount() > 0 && signum(addonSource.childcareFee()) > 0) {
            rooms.append(row("Kids Play Zone · " + addonSource.childrenCount() + " child" + (addonSource.childrenCount() == 1 ? "" : "ren"), money(addonSource.childcareFee())));
        }
        if (addonSource.fullBoard() && signum(addonSource.fullBoardFee()) > 0) {
            rooms.append(row("Full Board", money(addonSource.fullBoardFee())));
        }

        BigDecimal balance = total.subtract(paid);
        String paymentLine = balance.signum() <= 0
                ? "<p style=\"color:#6B705C;font-weight:600;\">Payment received in full.</p>"
                : "<p>Amount paid: " + money(paid) + " &middot; Balance due at check-in: <strong>" + money(balance) + "</strong></p>";

        return wrapper(
                "Booking Confirmed",
                "<p>Dear " + escape(first.guestName()) + ",</p>"
                + "<p>Thank you for choosing " + escape(hotelConfig.name()) + ". Your stay is confirmed:</p>"
                + "<table style=\"width:100%;border-collapse:collapse;margin:16px 0;\">"
                + row("<strong>Check-in</strong>", first.checkIn().toString())
                + row("<strong>Check-out</strong>", first.checkOut().toString() + " (" + nights + " night" + (nights == 1 ? "" : "s") + ")")
                + "</table>"
                + "<table style=\"width:100%;border-collapse:collapse;margin:16px 0;\">" + rooms + "</table>"
                + "<table style=\"width:100%;border-collapse:collapse;margin:16px 0;border-top:1px solid #E7DFD3;padding-top:8px;\">"
                + row("<strong>Total</strong>", "<strong>" + money(total) + "</strong>")
                + "</table>"
                + paymentLine
                + (first.notes() != null && !first.notes().isBlank() ? "<p><strong>Special request:</strong> " + escape(first.notes()) + "</p>" : "")
                + "<p>We look forward to hosting you.</p>"
        );
    }

    private String cancellationHtml(List<BookingDto> bookings) {
        BookingDto first = bookings.get(0);
        StringBuilder rooms = new StringBuilder();
        for (BookingDto b : bookings) {
            rooms.append(row(b.propertyName() != null ? b.propertyName() : ("Room #" + b.propertyId()), money(b.amount())));
        }
        return wrapper(
                "Booking Cancelled",
                "<p>Dear " + escape(first.guestName()) + ",</p>"
                + "<p>Your booking at " + escape(hotelConfig.name()) + " for " + first.checkIn() + " to " + first.checkOut() + " has been cancelled:</p>"
                + "<table style=\"width:100%;border-collapse:collapse;margin:16px 0;\">" + rooms + "</table>"
                + "<p>If a payment was already made against this booking, our team will be in touch about next steps.</p>"
                + "<p>We hope to host you another time.</p>"
        );
    }

    private String wrapper(String heading, String bodyHtml) {
        String contact = String.join(" &middot; ", nonBlank(hotelConfig.contact() != null ? hotelConfig.contact().email() : null),
                nonBlank(hotelConfig.contact() != null ? hotelConfig.contact().phone() : null));
        return "<div style=\"font-family:Georgia,'Times New Roman',serif;max-width:560px;margin:0 auto;color:#2B2B29;\">"
                + "<h1 style=\"font-size:22px;font-weight:normal;text-align:center;margin-bottom:4px;\">" + escape(hotelConfig.name()) + "</h1>"
                + "<p style=\"text-align:center;color:#6B705C;text-transform:uppercase;letter-spacing:1px;font-size:12px;margin-top:0;\">" + heading + "</p>"
                + "<hr style=\"border:none;border-top:1px solid #E7DFD3;margin:16px 0;\"/>"
                + "<div style=\"font-size:15px;line-height:1.6;\">" + bodyHtml + "</div>"
                + "<hr style=\"border:none;border-top:1px solid #E7DFD3;margin:24px 0 12px;\"/>"
                + "<p style=\"font-size:12px;color:#6B705C;text-align:center;\">" + contact + "</p>"
                + "</div>";
    }

    private static String row(String label, String value) {
        return "<tr>"
                + "<td style=\"padding:4px 0;color:#2B2B29;\">" + label + "</td>"
                + "<td style=\"padding:4px 0;text-align:right;color:#2B2B29;\">" + value + "</td>"
                + "</tr>";
    }

    private static String money(BigDecimal amount) {
        if (amount == null) return "₹0.00";
        return "₹" + amount.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString();
    }

    private static int signum(BigDecimal value) {
        return value == null ? 0 : value.signum();
    }

    private static String nonBlank(String value) {
        return value == null ? "" : value;
    }

    private static String escape(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
