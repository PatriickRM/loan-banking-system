package com.banking.credit.event;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class LoanCreatedEvent {
    private Long loanId;
    private Long customerId;
    private BigDecimal amount;
    private Integer termMonths;
    private BigDecimal interestRate;
    private String purpose;
}