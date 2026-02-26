package com.banking.notification.service;

import com.banking.notification.client.CustomerClient;
import com.banking.notification.entity.Notification;
import com.banking.notification.dto.CustomerResponse;
import com.banking.notification.enums.NotificationChannel;
import com.banking.notification.enums.NotificationStatus;
import com.banking.notification.enums.NotificationType;
import com.banking.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    private final CustomerClient customerClient;

    public void sendNotification(Long customerId, NotificationType type, Map<String, Object> data) {
        try {
            CustomerResponse customer = customerClient.getCustomerById(customerId);

            Notification notification = new Notification();
            notification.setUserId(customerId);
            notification.setEmail(customer.getEmail());
            notification.setPhone(customer.getPhone());
            notification.setType(type);
            notification.setChannel(NotificationChannel.EMAIL);
            notification.setStatus(NotificationStatus.PENDING);
            notification.setMetadata(data);

            // Preparar variables del email
            Map<String, Object> emailVariables = new HashMap<>(data);
            emailVariables.put("customerName", customer.getFirstName() + " " + customer.getLastName());

            String templateName = getTemplateName(type);
            String subject = getSubject(type);

            // Enviar email
            emailService.sendEmail(customer.getEmail(), subject, templateName, emailVariables);

            notification.setStatus(NotificationStatus.SENT);
            notification.setSentDate(LocalDateTime.now());

            notificationRepository.save(notification);

            log.info("Notification sent successfully: {} to {}", type, customerId);

        } catch (Exception e) {
            log.error("Error sending notification: {}", e.getMessage());

            Notification failedNotification = new Notification();
            failedNotification.setUserId(customerId);
            failedNotification.setType(type);
            failedNotification.setChannel(NotificationChannel.EMAIL);
            failedNotification.setStatus(NotificationStatus.FAILED);
            failedNotification.setErrorMessage(e.getMessage());
            failedNotification.setCreatedAt(LocalDateTime.now());
            failedNotification.setMetadata(data);

            notificationRepository.save(failedNotification);
        }
    }

    private String getTemplateName(NotificationType type) {
        return switch (type) {
            case LOAN_APPLICATION_RECEIVED -> "loan-application";
            case LOAN_APPROVED -> "loan-approved";
            case LOAN_REJECTED -> "loan-rejected";
            case LOAN_DISBURSED -> "loan-disbursed";
            case PAYMENT_RECEIVED -> "payment-received";
            case PAYMENT_REMINDER -> "payment-reminder";
            case PAYMENT_OVERDUE -> "payment-overdue";
            default -> "generic";
        };
    }

    private String getSubject(NotificationType type) {
        return switch (type) {
            case LOAN_APPLICATION_RECEIVED -> "Solicitud de préstamo recibida";
            case LOAN_APPROVED -> "¡Tu préstamo ha sido aprobado!";
            case LOAN_REJECTED -> "Actualización de tu solicitud de préstamo";
            case LOAN_DISBURSED -> "¡Tu préstamo ha sido desembolsado!";
            case PAYMENT_RECEIVED -> "Pago recibido correctamente";
            case PAYMENT_REMINDER -> "Recordatorio: Próximo pago";
            case PAYMENT_OVERDUE -> "Pago vencido - Acción requerida";
            default -> "Notificación - Loan Banking System";
        };
    }
}