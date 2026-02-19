package com.banking.payment.dto;

import com.banking.payment.enums.PaymentMethod;
import com.banking.payment.enums.PaymentStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class PaymentResponse {
    private Long id;
    private Long loanId;
    private Long scheduleId;
    private BigDecimal amount;
    private PaymentMethod paymentMethod;
    private String transactionId;
    private BigDecimal principalPaid;
    private BigDecimal interestPaid;
    private BigDecimal lateFee;
    private LocalDateTime paymentDate;
    private LocalDate dueDate;
    private PaymentStatus status;
    private String referenceNumber;
}