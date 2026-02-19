package com.banking.notification.consumer;

import com.banking.notification.enums.NotificationType;
import com.banking.notification.event.*;
import com.banking.notification.service.NotificationService;
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

    @KafkaListener(topics = "loan-created", groupId = "notification-service")
    public void handleLoanCreated(LoanCreatedEvent event) {
        log.info("Processing loan created event: {}", event.getLoanId());

        Map<String, Object> data = new HashMap<>();
        data.put("loanId", event.getLoanId());
        data.put("amount", event.getAmount());
        data.put("termMonths", event.getTermMonths());

        notificationService.sendNotification(
                event.getCustomerId(),
                NotificationType.LOAN_APPLICATION_RECEIVED,
                data
        );
    }

    @KafkaListener(topics = "evaluation-completed", groupId = "notification-service")
    public void handleEvaluationCompleted(EvaluationCompletedEvent event) {
        log.info("Processing evaluation completed event: {}", event.getLoanId());

        // Este evento se usará cuando el loan service actualice el estado
        // Por ahora solo registramos
    }

    @KafkaListener(topics = "payment-received", groupId = "notification-service")
    public void handlePaymentReceived(PaymentReceivedEvent event) {
        log.info("Processing payment received event: {}", event.getPaymentId());

        Map<String, Object> data = new HashMap<>();
        data.put("amount", event.getAmount());
        data.put("installmentNumber", event.getInstallmentNumber());
        data.put("paymentDate", event.getPaymentDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
        data.put("transactionId", "TXN-" + event.getPaymentId());

        notificationService.sendNotification(
                event.getCustomerId(),
                NotificationType.PAYMENT_RECEIVED,
                data
        );
    }

    @KafkaListener(topics = "payment-overdue", groupId = "notification-service")
    public void handlePaymentOverdue(PaymentOverdueEvent event) {
        log.info("Processing payment overdue event: {}", event.getScheduleId());

        Map<String, Object> data = new HashMap<>();
        data.put("amount", event.getAmount());
        data.put("installmentNumber", event.getInstallmentNumber());
        data.put("dueDate", event.getDueDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        data.put("daysOverdue", event.getDaysOverdue());

        notificationService.sendNotification(
                event.getCustomerId(),
                NotificationType.PAYMENT_OVERDUE,
                data
        );
    }
}