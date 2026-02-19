package com.banking.payment.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class LoanResponse {
    private Long id;
    private Long customerId;
    private BigDecimal amount;
    private BigDecimal interestRate;
    private Integer termMonths;
    private BigDecimal monthlyPayment;
    private BigDecimal totalAmount;
    private BigDecimal outstandingBalance;
}