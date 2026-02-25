package com.banking.loan.event;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record LoanDisbursedEvent(
        Long loanId,
        Long customerId,
        BigDecimal totalAmount,
        BigDecimal monthlyPayment,
        Integer termMonths,
        LocalDateTime disbursementDate
) {}
