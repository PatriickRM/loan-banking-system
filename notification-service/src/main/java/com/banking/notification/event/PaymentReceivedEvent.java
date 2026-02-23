package com.banking.notification.event;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentReceivedEvent(
        Long paymentId,
        Long loanId,
        Long customerId,
        BigDecimal amount,
        BigDecimal principalPaid,
        BigDecimal interestPaid,
        Integer installmentNumber,
        LocalDateTime paymentDate
) {}