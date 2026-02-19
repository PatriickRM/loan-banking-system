package com.banking.credit.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ManualEvaluationRequest {
    @NotNull
    @Min(0)
    @Max(100)
    private Integer manualScore;

    @NotBlank
    private String evaluatorId;

    @NotBlank
    private String evaluatorName;

    private String comments;
}
