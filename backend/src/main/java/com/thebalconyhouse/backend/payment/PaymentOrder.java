package com.thebalconyhouse.backend.payment;

import java.math.BigDecimal;

public record PaymentOrder(String orderRef, BigDecimal amount) {}
