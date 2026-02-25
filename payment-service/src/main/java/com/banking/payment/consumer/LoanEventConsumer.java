package com.banking.payment.consumer;

import com.banking.payment.client.LoanClient;
import com.banking.payment.dto.LoanResponse;
import com.banking.payment.event.LoanDisbursedEvent;
import com.banking.payment.service.PaymentScheduleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
public class LoanEventConsumer {

    private final PaymentScheduleService scheduleService;
    private final LoanClient loanClient;

    @KafkaListener(topics = "loan-disbursed", groupId = "payment-service")
    public void handleLoanDisbursed(LoanDisbursedEvent event) {
        log.info("Received loan disbursed event: {}", event.getLoanId());
        try {
            LocalDate startDate = event.getDisbursementDate().toLocalDate();
            // Construir LoanResponse con datos del evento
            LoanResponse loan = new LoanResponse();
            loan.setId(event.getLoanId());
            loan.setCustomerId(event.getCustomerId());
            loan.setAmount(event.getTotalAmount());
            loan.setMonthlyPayment(event.getMonthlyPayment());
            loan.setTermMonths(event.getTermMonths());
            scheduleService.generateSchedule(loan, startDate);
            log.info("Schedule generated for loan: {}", event.getLoanId());
        } catch (Exception e) {
            log.error("Error processing event: {}", e.getMessage(), e);
        }
    }
}