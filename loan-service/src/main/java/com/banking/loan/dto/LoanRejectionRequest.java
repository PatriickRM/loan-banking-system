package com.banking.loan.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LoanRejectionRequest {
    @NotBlank(message = "Razón de rechazo es requerida")
    private String rejectionReason;

    @NotNull
    private String evaluatedBy;
}