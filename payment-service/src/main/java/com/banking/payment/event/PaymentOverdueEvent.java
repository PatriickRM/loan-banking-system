package com.banking.payment.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentOverdueEvent {
    private Long scheduleId;
    private Long loanId;
    private Long customerId;
    private Integer installmentNumber;
    private BigDecimal amount;
    private LocalDate dueDate;
    private Integer daysOverdue;
}