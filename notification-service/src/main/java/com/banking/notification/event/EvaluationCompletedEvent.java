package com.banking.notification.event;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDateTime;

@JsonIgnoreProperties(ignoreUnknown = true)

public record EvaluationCompletedEvent(
        Long evaluationId,
        Long loanId,
        Long customerId,
        Integer finalScore,
        String recommendation,
        LocalDateTime completedAt
) {}