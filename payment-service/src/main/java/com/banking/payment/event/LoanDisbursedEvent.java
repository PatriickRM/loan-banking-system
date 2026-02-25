package com.banking.payment.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor
public class LoanDisbursedEvent {
    private Long loanId;
    private Long customerId;
    private BigDecimal totalAmount;
    private BigDecimal monthlyPayment;
    private Integer termMonths;
    private LocalDateTime disbursementDate;
}
