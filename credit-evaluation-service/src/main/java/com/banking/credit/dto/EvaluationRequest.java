package com.banking.credit.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class EvaluationRequest {
    @NotNull
    private Long customerId;
    @NotNull
    private Long loanId;
}
