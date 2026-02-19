package com.banking.payment.scheduler;

import com.banking.payment.dto.PaymentScheduleResponse;
import com.banking.payment.event.PaymentOverdueEvent;
import com.banking.payment.service.PaymentScheduleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentScheduledTasks {

    private final PaymentScheduleService scheduleService;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    // Ejecutar diariamente a las 8 AM
    @Scheduled(cron = "0 0 8 * * ?")
    public void checkOverduePayments() {
        log.info("Checking for overdue payments...");

        List<PaymentScheduleResponse> overduePayments = scheduleService.getOverduePayments();

        for (PaymentScheduleResponse schedule : overduePayments) {
            long daysOverdue = ChronoUnit.DAYS.between(schedule.getDueDate(), LocalDate.now());

            PaymentOverdueEvent event = new PaymentOverdueEvent(
                    schedule.getId(),
                    schedule.getLoanId(),
                    null, // Customer ID (obtener del loan service)
                    schedule.getInstallmentNumber(),
                    schedule.getAmount(),
                    schedule.getDueDate(),
                    (int) daysOverdue
            );

            kafkaTemplate.send("payment-overdue", event);
            log.info("Published overdue payment event for schedule: {}", schedule.getId());
        }

        log.info("Found {} overdue payments", overduePayments.size());
    }
}