package com.thebalconyhouse.backend.payment;

public record PaymentVerificationResult(boolean success, String failureReason) {}
