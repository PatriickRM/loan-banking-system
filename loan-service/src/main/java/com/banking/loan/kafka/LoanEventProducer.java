package com.banking.loan.kafka;

import com.banking.loan.event.LoanApprovedEvent;
import com.banking.loan.event.LoanCreatedEvent;
import com.banking.loan.event.LoanDisbursedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class LoanEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void sendLoanCreated(LoanCreatedEvent event) {
        kafkaTemplate.send("loan-created", String.valueOf(event.loanId()), event);
        log.info("Evento LoanCreated enviado para loanId={}", event.loanId());
    }

    public void sendLoanApproved(LoanApprovedEvent event) {
        kafkaTemplate.send("loan-approved", String.valueOf(event.loanId()), event);
        log.info("Evento LoanApproved enviado para loanId={}", event.loanId());
    }

    public void sendLoanDisbursed(LoanDisbursedEvent event) {
        kafkaTemplate.send("loan-disbursed", String.valueOf(event.loanId()), event);
        log.info("Evento LoanDisbursed enviado para loanId={}", event.loanId());
    }
}