package com.banking.credit.consumer;

import com.banking.credit.dto.EvaluationRequest;
import com.banking.credit.event.LoanCreatedEvent;
import com.banking.credit.service.EvaluationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class LoanEventConsumer {

    private final EvaluationService evaluationService;

    @KafkaListener(topics = "loan-created", groupId = "evaluation-service")
    public void handleLoanCreated(LoanCreatedEvent event) {
        log.info("Received loan created event: {}", event.getLoanId());

        try {
            EvaluationRequest request = new EvaluationRequest();
            request.setCustomerId(event.getCustomerId());
            request.setLoanId(event.getLoanId());

            evaluationService.createEvaluation(request);

            log.info("Evaluation created for loan: {}", event.getLoanId());
        } catch (Exception e) {
            log.error("Error processing loan created event: {}", e.getMessage());
        }
    }
}