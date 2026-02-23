package com.banking.notification.event;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PaymentOverdueEvent(
        Long scheduleId,
        Long loanId,
        Long customerId,
        Integer installmentNumber,
        BigDecimal amount,
        LocalDate dueDate,
        Integer daysOverdue
) {}
