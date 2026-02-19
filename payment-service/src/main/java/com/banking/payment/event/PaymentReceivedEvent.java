package com.banking.payment.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentReceivedEvent {
    private Long paymentId;
    private Long loanId;
    private Long customerId;
    private BigDecimal amount;
    private BigDecimal principalPaid;
    private BigDecimal interestPaid;
    private Integer installmentNumber;
    private LocalDateTime paymentDate;
}