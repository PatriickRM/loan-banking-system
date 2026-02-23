package com.banking.notification.event;

import java.time.LocalDateTime;

public record EvaluationCompletedEvent(
        Long evaluationId,
        Long loanId,
        Long customerId,
        Integer finalScore,
        String recommendation,
        LocalDateTime completedAt
) {}