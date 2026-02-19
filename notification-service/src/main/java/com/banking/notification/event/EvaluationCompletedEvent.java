package com.banking.notification.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationCompletedEvent {
    private Long evaluationId;
    private Long loanId;
    private Long customerId;
    private Integer finalScore;
    private String recommendation;
    private LocalDateTime completedAt;
}