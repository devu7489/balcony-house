package com.thebalconyhouse.backend.payment;

import java.math.BigDecimal;

/**
 * The seam between BookingService and however payment actually happens. Exactly one
 * implementation exists today (MockPaymentGateway); a real provider (e.g. Razorpay) plugs
 * into this same interface later, selected via app.payment.provider - BookingService, the
 * checkout retry flow, and the hold-cleanup job never need to change when that happens.
 *
 * Deliberately has no refund() - see PaymentHoldCleanupScheduler's package docs / the plan
 * this was built from for why refunds stay a manual front-desk action for now rather than
 * a gateway call routed through the same shared payment-recording code refunds already use.
 */
public interface PaymentGateway {

    /** Identifies which provider processed a payment - stored in Payment.reference for audit,
     *  not Payment.method (which stays the human-facing "Online" regardless of provider). */
    String providerName();

    /** Opens a payment attempt for the given amount. receiptId is a human-readable tag
     *  (e.g. "group-42" or "booking-17") a real gateway would show in its own dashboard. */
    PaymentOrder createOrder(BigDecimal amount, String receiptId);

    /** Attempts to settle the given order. attemptNumber lets a gateway (or the mock) vary
     *  its response by try - real gateways don't need this (the guest's own retry in their
     *  UI is what attempt 2 means), but the mock uses it to deterministically fail once. */
    PaymentVerificationResult verifyPayment(String orderRef, int attemptNumber);
}
