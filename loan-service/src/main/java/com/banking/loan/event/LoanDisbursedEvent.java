package com.banking.loan.event;

import java.math.BigDecimal;

public record LoanDisbursedEvent(
        Long loanId,
        Long customerId,
        BigDecimal totalAmount,
        BigDecimal monthlyPayment,
        Integer termMonths
) {}
