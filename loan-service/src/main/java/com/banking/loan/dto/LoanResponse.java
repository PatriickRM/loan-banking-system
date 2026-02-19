package com.banking.loan.dto;

import com.banking.loan.enums.LoanStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class LoanResponse {
    private Long id;
    private Long customerId;
    private String customerName;
    private Long loanTypeId;
    private String loanTypeName;
    private BigDecimal amount;
    private BigDecimal approvedAmount;
    private BigDecimal interestRate;
    private Integer termMonths;
    private LoanStatus status;
    private String purpose;
    private BigDecimal monthlyPayment;
    private BigDecimal totalAmount;
    private BigDecimal outstandingBalance;
    private LocalDateTime applicationDate;
    private LocalDateTime approvalDate;
    private LocalDateTime disbursementDate;
    private String rejectionReason;
}