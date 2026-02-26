package com.banking.notification.event;

import java.math.BigDecimal;

public record LoanApprovedEvent(
        Long loanId,
        Long customerId,
        BigDecimal approvedAmount,
        String evaluatedBy
) {}