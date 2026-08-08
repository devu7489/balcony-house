package com.thebalconyhouse.backend.notification;

import com.thebalconyhouse.backend.booking.BookingStatus;
import com.thebalconyhouse.backend.booking.dto.BookingDto;
import com.thebalconyhouse.backend.booking.dto.InvoiceDto;
import com.thebalconyhouse.backend.booking.dto.InvoiceLineDto;
import com.thebalconyhouse.backend.booking.dto.PaymentRecordDto;
import com.thebalconyhouse.backend.hotel.HotelConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Builds every guest-facing lifecycle email (booking confirmed, cancelled, checked in,
 * checked out with invoice) and hands the finished HTML to EmailService. Takes the full list
 * of rooms for a trip (or a single-element list for a standalone booking) so a multi-room
 * trip reads as one email, not one per room. Every public method here is a best-effort
 * notification - see EmailService for why nothing here can throw.
 */
@Service
public class BookingEmailService {

    private static final Logger log = LoggerFactory.getLogger(BookingEmailService.class);
    private static final DateTimeFormatter FRIENDLY_DATE = DateTimeFormatter.ofPattern("d MMM yyyy");

    private final EmailService emailService;
    private final HotelConfig hotelConfig;
    private final String frontendUrl;
    private final ZoneId hotelZoneId;

    public BookingEmailService(EmailService emailService, HotelConfig hotelConfig,
                                @Value("${app.frontend-url}") String frontendUrl,
                                @Value("${app.hotel.timezone}") String hotelTimezone) {
        this.emailService = emailService;
        this.hotelConfig = hotelConfig;
        this.frontendUrl = frontendUrl;
        this.hotelZoneId = ZoneId.of(hotelTimezone);
    }

    public void sendConfirmation(List<BookingDto> bookings) {
        try {
            if (bookings == null || bookings.isEmpty()) return;
            BookingDto first = bookings.get(0);
            String subject = hotelConfig.name() + " — Booking Confirmed, " + friendly(first.checkIn()) + " to " + friendly(first.checkOut());
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

    public void sendCheckIn(List<BookingDto> bookings) {
        try {
            List<BookingDto> checkedIn = bookings == null ? List.of() : bookings.stream()
                    .filter(b -> b.status() == BookingStatus.CHECKED_IN).toList();
            if (checkedIn.isEmpty()) return;
            BookingDto first = checkedIn.get(0);
            String subject = hotelConfig.name() + " — You're Checked In";
            emailService.send(first.guestEmail(), subject, checkInHtml(checkedIn));
        } catch (Exception e) {
            log.warn("Failed to build check-in email: {}", e.getMessage());
        }
    }

    public void sendCheckoutInvoice(List<BookingDto> bookings, InvoiceDto invoice) {
        try {
            if (bookings == null || bookings.isEmpty() || invoice == null) return;
            BookingDto first = bookings.get(0);
            String subject = hotelConfig.name() + " — Thank You for Staying (Invoice " + invoice.invoiceNumber() + ")";
            String link = first.bookingGroupId() != null
                    ? frontendUrl + "/invoice/trip/" + first.bookingGroupId()
                    : frontendUrl + "/invoice/booking/" + first.id();
            emailService.send(first.guestEmail(), subject, checkoutHtml(invoice, link));
        } catch (Exception e) {
            log.warn("Failed to build checkout/invoice email: {}", e.getMessage());
        }
    }

    // ---------------------------------------------------------------- templates

    private String confirmationHtml(List<BookingDto> bookings) {
        BookingDto first = bookings.get(0);
        long nights = ChronoUnit.DAYS.between(first.checkIn(), first.checkOut());

        StringBuilder rooms = new StringBuilder();
        BigDecimal total = BigDecimal.ZERO;
        BigDecimal paid = BigDecimal.ZERO;
        for (BookingDto b : bookings) {
            if (b.status() == BookingStatus.CANCELLED) continue;
            rooms.append(lineRow(b.propertyName() + (b.roomNumber() != null ? " (" + b.roomNumber() + ")" : ""), money(b.amount())));
            total = total.add(orZero(b.payableTotal()));
            paid = paid.add(orZero(b.amountPaid()));
        }
        BookingDto addonSource = bookings.stream().filter(b -> b.status() != BookingStatus.CANCELLED).findFirst().orElse(first);
        if (addonSource.childrenCount() > 0 && signum(addonSource.childcareFee()) > 0) {
            rooms.append(lineRow("Kids Play Zone · " + addonSource.childrenCount() + " child" + (addonSource.childrenCount() == 1 ? "" : "ren"), money(addonSource.childcareFee())));
        }
        if (addonSource.fullBoard() && signum(addonSource.fullBoardFee()) > 0) {
            rooms.append(lineRow("Full Board", money(addonSource.fullBoardFee())));
        }

        BigDecimal balance = total.subtract(paid);
        String paymentNote = balance.signum() <= 0
                ? statusPill("Payment received in full", "#EEF1EC", "#4A5240")
                : "<p style=\"margin:16px 0 0;\">Amount paid: <strong>" + money(paid) + "</strong> &nbsp;&middot;&nbsp; Balance due at check-in: <strong>" + money(balance) + "</strong></p>";

        String body = greeting(first.guestName())
                + paragraph("Thank you for choosing " + escape(hotelConfig.name()) + ". Your stay is confirmed — here are the details:")
                + detailsCard(
                    keyValueRow("Check-in", friendly(first.checkIn()))
                    + keyValueRow("Check-out", friendly(first.checkOut()) + " &nbsp;(" + nights + " night" + (nights == 1 ? "" : "s") + ")")
                  )
                + sectionHeading("Your stay")
                + lineItemsTable(rooms.toString(), "Total", money(total))
                + paymentNote
                + (isBlank(first.notes()) ? "" : paragraph("<strong>Special request:</strong> " + escape(first.notes())))
                + ctaButton("Manage your booking", frontendUrl + "/my-bookings")
                + paragraph("We look forward to hosting you.");

        return wrapper("Booking Confirmed", body);
    }

    private String cancellationHtml(List<BookingDto> bookings) {
        BookingDto first = bookings.get(0);
        StringBuilder rooms = new StringBuilder();
        for (BookingDto b : bookings) {
            rooms.append(lineRow(b.propertyName() != null ? b.propertyName() : ("Room #" + b.propertyId()), money(b.amount())));
        }
        String body = greeting(first.guestName())
                + paragraph("Your booking at " + escape(hotelConfig.name()) + " for " + friendly(first.checkIn()) + " to " + friendly(first.checkOut()) + " has been cancelled:")
                + sectionHeading("Cancelled")
                + "<table style=\"width:100%;border-collapse:collapse;margin:4px 0 20px;\">" + rooms + "</table>"
                + paragraph("If a payment was already made against this booking, our team will be in touch about next steps.")
                + ctaButton("Browse rooms", frontendUrl + "/stay")
                + paragraph("We hope to host you another time.");
        return wrapper("Booking Cancelled", body);
    }

    private String checkInHtml(List<BookingDto> bookings) {
        BookingDto first = bookings.get(0);
        long nights = ChronoUnit.DAYS.between(first.checkIn(), first.checkOut());

        StringBuilder rooms = new StringBuilder();
        BigDecimal total = BigDecimal.ZERO;
        BigDecimal paid = BigDecimal.ZERO;
        for (BookingDto b : bookings) {
            String label = b.propertyName() + (b.roomNumber() != null && !b.roomNumber().isBlank() ? " · Room " + b.roomNumber() : "");
            rooms.append(lineRow(label, b.guests() + " guest" + (b.guests() == 1 ? "" : "s")));
            total = total.add(orZero(b.payableTotal()));
            paid = paid.add(orZero(b.amountPaid()));
        }
        BigDecimal balance = total.subtract(paid);

        String body = "<p style=\"margin:0 0 16px;\">Welcome, " + escape(first.guestName()) + "!</p>"
                + paragraph("You're checked in at " + escape(hotelConfig.name()) + ". Here's a quick summary of your stay:")
                + sectionHeading("Your room" + (bookings.size() > 1 ? "s" : ""))
                + "<table style=\"width:100%;border-collapse:collapse;margin:4px 0 20px;\">" + rooms + "</table>"
                + detailsCard(keyValueRow("Check-out", friendly(first.checkOut()) + " &nbsp;(" + nights + " night" + (nights == 1 ? "" : "s") + ")"))
                + (balance.signum() > 0
                    ? "<p style=\"margin:16px 0 0;\">A balance of <strong>" + money(balance) + "</strong> is still due — our front desk will collect this before check-out.</p>"
                    : statusPill("Payment received in full", "#EEF1EC", "#4A5240"))
                + ctaButton("Manage your booking", frontendUrl + "/my-bookings")
                + paragraph("Enjoy your stay!");

        return wrapper("You're Checked In", body);
    }

    private String checkoutHtml(InvoiceDto invoice, String invoiceUrl) {
        StringBuilder lines = new StringBuilder();
        for (InvoiceLineDto line : invoice.lines()) {
            BigDecimal amt = line.amount();
            lines.append(lineRow(escape(line.description()), (amt != null && amt.signum() < 0 ? "-" : "") + money(amt != null ? amt.abs() : null)));
        }

        StringBuilder totals = new StringBuilder();
        boolean gstLines = invoice.gstEnabled() && invoice.gstRatePercent() != null && invoice.gstRatePercent().signum() > 0;
        if (gstLines) {
            totals.append(keyValueRow("Taxable value", money(invoice.taxableValue())));
            totals.append(keyValueRow("CGST @ " + half(invoice.gstRatePercent()) + "%", money(invoice.cgstAmount())));
            totals.append(keyValueRow("SGST @ " + half(invoice.gstRatePercent()) + "%", money(invoice.sgstAmount())));
        }

        StringBuilder payments = new StringBuilder();
        if (invoice.payments() != null) {
            for (PaymentRecordDto p : invoice.payments()) {
                String when = p.paidAt() != null ? p.paidAt().atZone(hotelZoneId).format(FRIENDLY_DATE) : "";
                payments.append(lineRow(money(p.amount()) + " &middot; " + escape(p.method()) + (isBlank(p.reference()) ? "" : " (" + escape(p.reference()) + ")"), when));
            }
        }

        String body = greeting(invoice.guestName())
                + paragraph("We hope you enjoyed your time at " + escape(hotelConfig.name()) + ". Your stay from "
                        + friendly(invoice.checkIn()) + " to " + friendly(invoice.checkOut()) + " has concluded — here's your invoice:")
                + detailsCard(
                    keyValueRow("Invoice number", invoice.invoiceNumber())
                    + keyValueRow("Date", invoice.generatedAt() != null ? invoice.generatedAt().atZone(hotelZoneId).format(FRIENDLY_DATE) : "")
                  )
                + sectionHeading("Charges")
                + lineItemsTable(lines.toString(), null, null)
                + (totals.length() > 0 ? "<table style=\"width:100%;border-collapse:collapse;margin:8px 0 0;\">" + totals + "</table>" : "")
                + "<table style=\"width:100%;border-collapse:collapse;margin:8px 0 20px;border-top:1px solid #E7DFD3;\">"
                + keyValueRow("<strong>Total paid</strong>", "<strong>" + money(invoice.totalAmount()) + "</strong>")
                + "</table>"
                + (payments.length() > 0
                    ? sectionHeading("Payments received") + "<table style=\"width:100%;border-collapse:collapse;margin:4px 0 20px;\">" + payments + "</table>"
                    : "")
                + ctaButton("View &amp; Print Invoice", invoiceUrl)
                + paragraph("We hope to welcome you back to " + escape(hotelConfig.name()) + " soon.");

        return wrapper("Thank You for Staying", body);
    }

    // ---------------------------------------------------------------- shared HTML building blocks

    private String wrapper(String heading, String bodyHtml) {
        String contact = String.join(" &middot; ",
                nonBlank(hotelConfig.contact() != null ? hotelConfig.contact().email() : null),
                nonBlank(hotelConfig.contact() != null ? hotelConfig.contact().phone() : null))
                .replaceAll("^ &middot; | &middot; $", "");
        String address = hotelConfig.contact() != null ? nonBlank(hotelConfig.contact().address()) : "";

        return "<div style=\"background-color:#F5F1EA;padding:32px 12px;font-family:Georgia,'Times New Roman',serif;\">"
                + "<div style=\"max-width:560px;margin:0 auto;background-color:#FFFFFF;border:1px solid #E7DFD3;border-radius:14px;overflow:hidden;\">"
                + "<div style=\"background-color:#2B2B29;padding:36px 28px;text-align:center;\">"
                + "<p style=\"margin:0;color:#FAF7F2;font-size:24px;letter-spacing:0.3px;\">" + escape(hotelConfig.name()) + "</p>"
                + "<p style=\"margin:8px 0 0;color:#C9C2B4;font-size:11px;text-transform:uppercase;letter-spacing:2.5px;\">" + escape(heading) + "</p>"
                + "</div>"
                + "<div style=\"padding:32px 28px;color:#2B2B29;font-size:15px;line-height:1.65;\">" + bodyHtml + "</div>"
                + "<div style=\"background-color:#F5F1EA;padding:22px 28px;text-align:center;border-top:1px solid #E7DFD3;\">"
                + "<p style=\"margin:0;font-size:12px;color:#6B705C;\">" + contact + "</p>"
                + (isBlank(address) ? "" : "<p style=\"margin:6px 0 0;font-size:11px;color:#9C9689;\">" + escape(address) + "</p>")
                + "</div>"
                + "</div>"
                + "</div>";
    }

    private static String greeting(String guestName) {
        return "<p style=\"margin:0 0 16px;\">Dear " + escape(guestName) + ",</p>";
    }

    private static String paragraph(String html) {
        return "<p style=\"margin:16px 0 0;\">" + html + "</p>";
    }

    private static String sectionHeading(String text) {
        return "<p style=\"margin:24px 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:1.2px;color:#6B705C;\">" + escape(text) + "</p>";
    }

    /** A soft, bordered box for a couple of key stay facts (dates, invoice number, etc). */
    private static String detailsCard(String rowsHtml) {
        return "<table style=\"width:100%;border-collapse:collapse;background-color:#F5F1EA;border-radius:10px;margin:16px 0 0;\">"
                + "<tr><td style=\"padding:16px 18px;\">"
                + "<table style=\"width:100%;border-collapse:collapse;\">" + rowsHtml + "</table>"
                + "</td></tr></table>";
    }

    /** Muted label / value pair, used inside detailsCard and totals blocks. */
    private static String keyValueRow(String label, String value) {
        return "<tr>"
                + "<td style=\"padding:4px 0;color:#6B705C;font-size:13px;\">" + label + "</td>"
                + "<td style=\"padding:4px 0;text-align:right;color:#2B2B29;font-size:13px;\">" + value + "</td>"
                + "</tr>";
    }

    /** A row inside an itemized table (rooms, add-ons, invoice lines, payments). */
    private static String lineRow(String label, String value) {
        return "<tr>"
                + "<td style=\"padding:9px 0;border-bottom:1px solid #EFEAE0;color:#2B2B29;\">" + label + "</td>"
                + "<td style=\"padding:9px 0;border-bottom:1px solid #EFEAE0;text-align:right;color:#2B2B29;white-space:nowrap;\">" + value + "</td>"
                + "</tr>";
    }

    /** Itemized table with an optional bold total row underneath. */
    private static String lineItemsTable(String rowsHtml, String totalLabel, String totalValue) {
        String total = totalLabel == null ? "" :
                "<tr><td style=\"padding:10px 0 0;font-weight:600;\">" + totalLabel + "</td>"
                + "<td style=\"padding:10px 0 0;text-align:right;font-weight:600;\">" + totalValue + "</td></tr>";
        return "<table style=\"width:100%;border-collapse:collapse;margin:4px 0 0;\">" + rowsHtml + total + "</table>";
    }

    private static String ctaButton(String label, String url) {
        return "<div style=\"text-align:center;margin:28px 0 8px;\">"
                + "<a href=\"" + url + "\" style=\"display:inline-block;background-color:#6B705C;color:#FAF7F2;text-decoration:none;"
                + "padding:12px 30px;border-radius:999px;font-size:13px;letter-spacing:0.4px;font-family:Georgia,serif;\">" + label + "</a>"
                + "</div>";
    }

    private static String statusPill(String text, String bg, String fg) {
        return "<p style=\"margin:16px 0 0;\"><span style=\"display:inline-block;background-color:" + bg + ";color:" + fg
                + ";padding:6px 14px;border-radius:999px;font-size:12px;font-weight:600;\">" + escape(text) + "</span></p>";
    }

    // ---------------------------------------------------------------- formatting helpers

    private static String friendly(java.time.LocalDate date) {
        return date == null ? "" : date.format(FRIENDLY_DATE);
    }

    private static String half(BigDecimal rate) {
        return rate.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP).stripTrailingZeros().toPlainString();
    }

    private static BigDecimal orZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private static int signum(BigDecimal value) {
        return value == null ? 0 : value.signum();
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static String nonBlank(String value) {
        return value == null ? "" : value;
    }

    private static String money(BigDecimal amount) {
        if (amount == null) return "₹0.00";
        return "₹" + amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private static String escape(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
