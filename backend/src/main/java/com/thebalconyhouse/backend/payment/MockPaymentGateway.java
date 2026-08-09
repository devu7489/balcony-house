package com.thebalconyhouse.backend.payment;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Stands in for a real gateway until Razorpay (or similar) is wired up - always the active
 * PaymentGateway bean unless app.payment.provider says otherwise. Deliberately NOT always-
 * succeed: the first verification attempt always fails, the second (and any later) always
 * succeeds, so the real hold -> fail -> retry -> succeed path is genuinely exercised today,
 * not just assumed to work once a real gateway exists. See PaymentHoldCleanupScheduler for
 * what happens if a guest never retries.
 */
@Service
@ConditionalOnProperty(name = "app.payment.provider", havingValue = "mock", matchIfMissing = true)
public class MockPaymentGateway implements PaymentGateway {

    @Override
    public String providerName() {
        return "mock";
    }

    @Override
    public PaymentOrder createOrder(BigDecimal amount, String receiptId) {
        return new PaymentOrder("mock-" + UUID.randomUUID().toString().substring(0, 8), amount);
    }

    @Override
    public PaymentVerificationResult verifyPayment(String orderRef, int attemptNumber) {
        if (attemptNumber < 2) {
            return new PaymentVerificationResult(false, "Mock decline on first attempt (simulated) - retry to succeed");
        }
        return new PaymentVerificationResult(true, null);
    }
}
