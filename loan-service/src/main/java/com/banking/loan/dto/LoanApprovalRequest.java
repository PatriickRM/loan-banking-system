package com.banking.loan.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class LoanApprovalRequest {
    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal approvedAmount;

    @NotNull
    private String evaluatedBy;
}