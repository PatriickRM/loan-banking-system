package com.banking.payment.dto;

import com.banking.payment.enums.PaymentScheduleStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class PaymentScheduleResponse {
    private Long id;
    private Long loanId;
    private Integer installmentNumber;
    private BigDecimal amount;
    private BigDecimal principal;
    private BigDecimal interest;
    private BigDecimal remainingBalance;
    private LocalDate dueDate;
    private PaymentScheduleStatus status;
    private Integer daysUntilDue;
    private Boolean isOverdue;
}