package com.banking.credit.dto;

import com.banking.credit.enums.EvaluationStatus;
import com.banking.credit.enums.Recommendation;
import com.banking.credit.enums.RiskLevel;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class EvaluationResponse {
    private Long id;
    private Long customerId;
    private Long loanId;
    private Integer automaticScore;
    private Integer manualScore;
    private Integer finalScore;
    private Integer creditScore;
    private EvaluationStatus status;
    private Recommendation recommendation;
    private RiskLevel riskLevel;
    private String comments;
    private LocalDateTime evaluationDate;
    private LocalDateTime completedDate;
}

