package com.banking.notification.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoanCreatedEvent {
    private Long loanId;
    private Long customerId;
    private BigDecimal amount;
    private Integer termMonths;
    private LocalDateTime createdAt;
}