package com.banking.loan.event;

import java.math.BigDecimal;

public record LoanCreatedEvent(
        Long loanId,
        Long customerId,
        BigDecimal amount,
        Integer termMonths,
        BigDecimal interestRate,
        String purpose
) {}