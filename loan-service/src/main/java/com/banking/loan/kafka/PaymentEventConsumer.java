package com.banking.loan.kafka;

import com.banking.loan.entity.Loan;
import com.banking.loan.enums.LoanStatus;
import com.banking.loan.repository.LoanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentEventConsumer {

    private final LoanRepository loanRepository;

    @KafkaListener(topics = "payment-received", groupId = "loan-service")
    @Transactional
    public void onPaymentReceived(Map<String, Object> payload) {
        try {
            Long loanId = Long.valueOf(payload.get("loanId").toString());
            BigDecimal principalPaid = new BigDecimal(payload.get("principalPaid").toString());

            Loan loan = loanRepository.findById(loanId)
                    .orElseThrow(() -> new RuntimeException("Préstamo no encontrado: " + loanId));

            BigDecimal newBalance = loan.getOutstandingBalance()
                    .subtract(principalPaid)
                    .max(BigDecimal.ZERO);

            loan.setOutstandingBalance(newBalance);

            if (newBalance.compareTo(BigDecimal.ZERO) == 0) {
                loan.setStatus(LoanStatus.COMPLETED);
                loan.setCompletionDate(LocalDateTime.now());
                log.info("Préstamo {} marcado como COMPLETED", loanId);
            }

            loanRepository.save(loan);
            log.info("outstandingBalance actualizado → loanId={} nuevoBalance={}", loanId, newBalance);

        } catch (Exception e) {
            log.error("Error procesando payment-received: {}", e.getMessage(), e);
        }
    }
}