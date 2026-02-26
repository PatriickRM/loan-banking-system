package com.banking.notification.event;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@JsonIgnoreProperties(ignoreUnknown = true)
public record LoanDisbursedEvent(
        Long loanId,
        Long customerId,
        BigDecimal totalAmount,
        BigDecimal monthlyPayment,
        Integer termMonths,
        LocalDateTime disbursementDate
) {}
