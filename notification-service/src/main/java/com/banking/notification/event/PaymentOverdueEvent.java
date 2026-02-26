package com.banking.notification.event;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.time.LocalDate;

@JsonIgnoreProperties(ignoreUnknown = true)
public record PaymentOverdueEvent(
        Long scheduleId,
        Long loanId,
        Long customerId,
        Integer installmentNumber,
        BigDecimal amount,
        LocalDate dueDate,
        Integer daysOverdue
) {}
