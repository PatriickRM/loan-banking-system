package com.banking.payment.service;

import com.banking.payment.client.LoanClient;
import com.banking.payment.dto.*;
import com.banking.payment.entity.Payment;
import com.banking.payment.entity.PaymentSchedule;
import com.banking.payment.enums.PaymentScheduleStatus;
import com.banking.payment.enums.PaymentStatus;
import com.banking.payment.event.PaymentReceivedEvent;
import com.banking.payment.repository.PaymentRepository;
import com.banking.payment.repository.PaymentScheduleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentScheduleRepository scheduleRepository;
    private final LoanClient loanClient;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Transactional
    public PaymentResponse processPayment(PaymentRequest request) {
        LoanResponse loan = loanClient.getLoanById(request.getLoanId());

        // Buscar próxima cuota pendiente
        List<PaymentSchedule> pendingSchedules = scheduleRepository
                .findByLoanIdOrderByInstallmentNumber(request.getLoanId()).stream()
                .filter(s -> s.getStatus() == PaymentScheduleStatus.PENDING)
                .collect(Collectors.toList());

        if (pendingSchedules.isEmpty()) {
            throw new RuntimeException("No hay cuotas pendientes para este préstamo");
        }

        PaymentSchedule schedule = pendingSchedules.get(0);

        // Validar monto
        if (request.getAmount().compareTo(schedule.getAmount()) < 0) {
            throw new RuntimeException("Monto insuficiente. Cuota completa: " + schedule.getAmount());
        }

        // Crear pago
        Payment payment = new Payment();
        payment.setLoanId(request.getLoanId());
        payment.setScheduleId(schedule.getId());
        payment.setAmount(request.getAmount());
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setTransactionId(UUID.randomUUID().toString());
        payment.setPrincipalPaid(schedule.getPrincipal());
        payment.setInterestPaid(schedule.getInterest());
        payment.setPaymentDate(LocalDateTime.now());
        payment.setDueDate(schedule.getDueDate());
        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setReferenceNumber(request.getReferenceNumber());
        payment.setNotes(request.getNotes());
        payment.setProcessedBy(request.getProcessedBy());

        // Calcular mora si aplica
        if (LocalDateTime.now().toLocalDate().isAfter(schedule.getDueDate())) {
            BigDecimal lateFee = schedule.getAmount()
                    .multiply(BigDecimal.valueOf(0.05)); // 5% de mora
            payment.setLateFee(lateFee);
        }

        payment = paymentRepository.save(payment);

        // Actualizar cronograma
        schedule.setStatus(PaymentScheduleStatus.PAID);
        scheduleRepository.save(schedule);

        // Publicar evento
        publishPaymentReceived(payment, loan.getCustomerId(), schedule.getInstallmentNumber());

        return mapToResponse(payment);
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsByLoan(Long loanId) {
        return paymentRepository.findByLoanIdOrderByPaymentDateDesc(loanId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPaymentById(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pago no encontrado"));
        return mapToResponse(payment);
    }

    private void publishPaymentReceived(Payment payment, Long customerId, Integer installmentNumber) {
        PaymentReceivedEvent event = new PaymentReceivedEvent(
                payment.getId(),
                payment.getLoanId(),
                customerId,
                payment.getAmount(),
                payment.getPrincipalPaid(),
                payment.getInterestPaid(),
                installmentNumber,
                payment.getPaymentDate()
        );

        kafkaTemplate.send("payment-received", event);
        log.info("Published payment received event for loan: {}", payment.getLoanId());
    }

    private PaymentResponse mapToResponse(Payment payment) {
        PaymentResponse response = new PaymentResponse();
        response.setId(payment.getId());
        response.setLoanId(payment.getLoanId());
        response.setScheduleId(payment.getScheduleId());
        response.setAmount(payment.getAmount());
        response.setPaymentMethod(payment.getPaymentMethod());
        response.setTransactionId(payment.getTransactionId());
        response.setPrincipalPaid(payment.getPrincipalPaid());
        response.setInterestPaid(payment.getInterestPaid());
        response.setLateFee(payment.getLateFee());
        response.setPaymentDate(payment.getPaymentDate());
        response.setDueDate(payment.getDueDate());
        response.setStatus(payment.getStatus());
        response.setReferenceNumber(payment.getReferenceNumber());
        return response;
    }
}