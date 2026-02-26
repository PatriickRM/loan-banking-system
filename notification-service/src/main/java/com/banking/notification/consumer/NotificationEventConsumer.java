package com.banking.notification.consumer;

import com.banking.notification.enums.NotificationType;
import com.banking.notification.event.*;
import com.banking.notification.service.NotificationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventConsumer {

    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "loan-created", groupId = "notification-service")
    public void handleLoanCreated(String message) {
        try {
            LoanCreatedEvent event = objectMapper.readValue(message, LoanCreatedEvent.class);
            log.info("Processing loan created event: {}", event.loanId());

            Map<String, Object> data = new HashMap<>();
            data.put("loanId", event.loanId());
            data.put("amount", event.amount());
            data.put("termMonths", event.termMonths());

            notificationService.sendNotification(
                    event.customerId(),
                    NotificationType.LOAN_APPLICATION_RECEIVED,
                    data
            );
        } catch (Exception e) {
            log.error("Error procesando loan-created: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = "payment-received", groupId = "notification-service")
    public void handlePaymentReceived(String message) {
        try {
            PaymentReceivedEvent event = objectMapper.readValue(message, PaymentReceivedEvent.class);
            log.info("Processing payment received event: {}", event.paymentId());

            Map<String, Object> data = new HashMap<>();
            data.put("amount", event.amount());
            data.put("installmentNumber", event.installmentNumber());
            data.put("paymentDate", event.paymentDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
            data.put("transactionId", "TXN-" + event.paymentId());

            notificationService.sendNotification(
                    event.customerId(),
                    NotificationType.PAYMENT_RECEIVED,
                    data
            );
        } catch (Exception e) {
            log.error("Error procesando payment-received: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = "payment-overdue", groupId = "notification-service")
    public void handlePaymentOverdue(String message) {
        try {
            PaymentOverdueEvent event = objectMapper.readValue(message, PaymentOverdueEvent.class);
            log.info("Processing payment overdue event: {}", event.scheduleId());

            Map<String, Object> data = new HashMap<>();
            data.put("loanId", event.loanId());
            data.put("amount", event.amount());
            data.put("installmentNumber", event.installmentNumber());
            data.put("dueDate", event.dueDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
            data.put("daysOverdue", event.daysOverdue());
            data.put("paymentUrl", "http://localhost:4200/payments");

            notificationService.sendNotification(
                    event.customerId(),
                    NotificationType.PAYMENT_OVERDUE,
                    data
            );
        } catch (Exception e) {
            log.error("Error procesando payment-overdue: {}", e.getMessage());
        }
    }

    // handleEvaluationCompleted lo dejamos vacío por ahora
    @KafkaListener(topics = "evaluation-completed", groupId = "notification-service")
    public void handleEvaluationCompleted(String message) {
        log.info("Evaluation completed event recibido (sin acción por ahora)");
    }

    @KafkaListener(topics = "loan-approved", groupId = "notification-service")
    public void handleLoanApproved(String message) {
        try {
            LoanApprovedEvent event = objectMapper.readValue(message, LoanApprovedEvent.class);
            log.info("Processing loan approved event: {}", event.loanId());

            Map<String, Object> data = new HashMap<>();
            data.put("loanId", event.loanId());
            data.put("approvedAmount", event.approvedAmount());
            data.put("evaluatedBy", event.evaluatedBy());

            notificationService.sendNotification(
                    event.customerId(),
                    NotificationType.LOAN_APPROVED,
                    data
            );
        } catch (Exception e) {
            log.error("Error procesando loan-approved: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = "loan-rejected", groupId = "notification-service")
    public void handleLoanRejected(String message) {
        try {
            LoanRejectedEvent event = objectMapper.readValue(message, LoanRejectedEvent.class);
            log.info("Processing loan rejected event: {}", event.loanId());

            Map<String, Object> data = new HashMap<>();
            data.put("loanId", event.loanId());
            data.put("rejectionReason", event.rejectionReason());

            notificationService.sendNotification(
                    event.customerId(),
                    NotificationType.LOAN_REJECTED,
                    data
            );
        } catch (Exception e) {
            log.error("Error procesando loan-rejected: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = "loan-disbursed", groupId = "notification-service")
    public void handleLoanDisbursed(String message) {
        try {
            LoanDisbursedEvent event = objectMapper.readValue(message, LoanDisbursedEvent.class);
            log.info("Processing loan disbursed event: {}", event.loanId());

            Map<String, Object> data = new HashMap<>();
            data.put("loanId", event.loanId());
            data.put("totalAmount", event.totalAmount());
            data.put("monthlyPayment", event.monthlyPayment());
            data.put("termMonths", event.termMonths());

            notificationService.sendNotification(
                    event.customerId(),
                    NotificationType.LOAN_DISBURSED,
                    data
            );
        } catch (Exception e) {
            log.error("Error procesando loan-disbursed: {}", e.getMessage());
        }
    }
}