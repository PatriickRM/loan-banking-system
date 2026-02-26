package com.banking.loan.service.impl;

import com.banking.loan.client.CustomerClient;
import com.banking.loan.dto.*;
import com.banking.loan.entity.Loan;
import com.banking.loan.entity.LoanType;
import com.banking.loan.enums.LoanStatus;
import com.banking.loan.event.LoanApprovedEvent;
import com.banking.loan.event.LoanCreatedEvent;
import com.banking.loan.event.LoanDisbursedEvent;
import com.banking.loan.event.LoanRejectedEvent;
import com.banking.loan.kafka.LoanEventProducer;
import com.banking.loan.repository.LoanRepository;
import com.banking.loan.repository.LoanTypeRepository;
import com.banking.loan.service.LoanService;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LoanServiceImpl implements LoanService {

    private final LoanRepository loanRepository;
    private final LoanTypeRepository loanTypeRepository;
    private final CustomerClient customerClient;
    private final LoanEventProducer loanEventProducer;

    @Transactional
    public LoanResponse createLoan(LoanRequest request) {
        // Validar cliente
        CustomerResponse customer = getCustomerWithFallback(request.getCustomerId());

        // Validar tipo de préstamo
        LoanType loanType = loanTypeRepository.findById(request.getLoanTypeId())
                .orElseThrow(() -> new RuntimeException("Tipo de préstamo no encontrado"));

        // Validar monto
        if (request.getAmount().compareTo(loanType.getMinAmount()) < 0 ||
                request.getAmount().compareTo(loanType.getMaxAmount()) > 0) {
            throw new RuntimeException("Monto fuera del rango permitido");
        }

        // Validar plazo
        if (request.getTermMonths() < loanType.getMinTermMonths() ||
                request.getTermMonths() > loanType.getMaxTermMonths()) {
            throw new RuntimeException("Plazo fuera del rango permitido");
        }

        // Crear préstamo
        Loan loan = new Loan();
        loan.setCustomerId(request.getCustomerId());
        loan.setLoanType(loanType);
        loan.setAmount(request.getAmount());
        loan.setInterestRate(loanType.getInterestRate());
        loan.setTermMonths(request.getTermMonths());
        loan.setPurpose(request.getPurpose());
        loan.setStatus(LoanStatus.PENDING);

        // Calcular cuota y total
        calculateLoanAmounts(loan);

        loan = loanRepository.save(loan);

        loanEventProducer.sendLoanCreated(new LoanCreatedEvent(
                loan.getId(),
                loan.getCustomerId(),
                loan.getAmount(),
                loan.getTermMonths(),
                loan.getInterestRate(),
                loan.getPurpose()
        ));

        return mapToResponse(loan, customer);
    }

    @Transactional(readOnly = true)
    public LoanResponse getLoanById(Long id) {
        Loan loan = loanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Préstamo no encontrado"));

        CustomerResponse customer = getCustomerWithFallback(loan.getCustomerId());
        return mapToResponse(loan, customer);
    }

    @Transactional(readOnly = true)
    public List<LoanResponse> getLoansByCustomer(Long customerId) {
        CustomerResponse customer = getCustomerWithFallback(customerId);

        return loanRepository.findByCustomerId(customerId).stream()
                .map(loan -> mapToResponse(loan, customer))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LoanResponse> getAllLoans() {
        return loanRepository.findAll().stream()
                .map(loan -> {
                    CustomerResponse customer = getCustomerWithFallback(loan.getCustomerId());
                    return mapToResponse(loan, customer);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LoanResponse> getLoansByStatus(LoanStatus status) {
        return loanRepository.findByStatus(status).stream()
                .map(loan -> {
                    CustomerResponse customer = getCustomerWithFallback(loan.getCustomerId());
                    return mapToResponse(loan, customer);
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public LoanResponse approveLoan(Long id, LoanApprovalRequest request) {
        Loan loan = loanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Préstamo no encontrado"));

        if (loan.getStatus() != LoanStatus.PENDING) {
            throw new RuntimeException("Solo se pueden aprobar préstamos pendientes");
        }

        loan.setApprovedAmount(request.getApprovedAmount());
        loan.setStatus(LoanStatus.APPROVED);
        loan.setApprovalDate(LocalDateTime.now());
        loan.setEvaluatedBy(request.getEvaluatedBy());

        // Recalcular con monto aprobado
        loan.setAmount(request.getApprovedAmount());
        calculateLoanAmounts(loan);

        loan = loanRepository.save(loan);

        CustomerResponse customer = getCustomerWithFallback(loan.getCustomerId());

        loanEventProducer.sendLoanApproved(new LoanApprovedEvent(
                loan.getId(),
                loan.getCustomerId(),
                loan.getApprovedAmount(),
                loan.getEvaluatedBy()
        ));

        return mapToResponse(loan, customer);
    }

    @Transactional
    public LoanResponse rejectLoan(Long id, LoanRejectionRequest request) {
        Loan loan = loanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Préstamo no encontrado"));

        if (loan.getStatus() != LoanStatus.PENDING) {
            throw new RuntimeException("Solo se pueden rechazar préstamos pendientes");
        }

        loan.setStatus(LoanStatus.REJECTED);
        loan.setRejectionDate(LocalDateTime.now());
        loan.setRejectionReason(request.getRejectionReason());
        loan.setEvaluatedBy(request.getEvaluatedBy());

        loan = loanRepository.save(loan);

        CustomerResponse customer = getCustomerWithFallback(loan.getCustomerId());

        loanEventProducer.sendLoanRejected(new LoanRejectedEvent(
                loan.getId(),
                loan.getCustomerId(),
                loan.getRejectionReason()
        ));

        return mapToResponse(loan, customer);
    }

    @Transactional
    public LoanResponse disburseLoan(Long id) {
        Loan loan = loanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Préstamo no encontrado"));

        if (loan.getStatus() != LoanStatus.APPROVED) {
            throw new RuntimeException("Solo se pueden desembolsar préstamos aprobados");
        }

        loan.setStatus(LoanStatus.ACTIVE);
        loan.setDisbursementDate(LocalDateTime.now());
        loan.setOutstandingBalance(loan.getTotalAmount());

        loan = loanRepository.save(loan);

        CustomerResponse customer = getCustomerWithFallback(loan.getCustomerId());

        loanEventProducer.sendLoanDisbursed(new LoanDisbursedEvent(
                loan.getId(),
                loan.getCustomerId(),
                loan.getTotalAmount(),
                loan.getMonthlyPayment(),
                loan.getTermMonths(),
                loan.getDisbursementDate(),
                loan.getInterestRate()
        ));

        return mapToResponse(loan, customer);
    }

    // Cálculo de cuota mensual (sistema francés)
    private void calculateLoanAmounts(Loan loan) {
        BigDecimal principal = loan.getAmount();
        BigDecimal monthlyRate = loan.getInterestRate()
                .divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP)
                .divide(BigDecimal.valueOf(12), 6, RoundingMode.HALF_UP);

        int months = loan.getTermMonths();

        // Fórmula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
        BigDecimal onePlusRate = BigDecimal.ONE.add(monthlyRate);
        BigDecimal power = onePlusRate.pow(months);

        BigDecimal monthlyPayment = principal
                .multiply(monthlyRate.multiply(power))
                .divide(power.subtract(BigDecimal.ONE), 2, RoundingMode.HALF_UP);

        BigDecimal totalAmount = monthlyPayment.multiply(BigDecimal.valueOf(months));

        loan.setMonthlyPayment(monthlyPayment);
        loan.setTotalAmount(totalAmount);
    }

    @CircuitBreaker(name = "customer-service", fallbackMethod = "getCustomerFallback")
    public CustomerResponse getCustomerWithFallback(Long customerId) {
        return customerClient.getCustomerById(customerId);
    }

        public CustomerResponse getCustomerFallback(Long customerId, Exception e) {
        CustomerResponse fallback = new CustomerResponse();
        fallback.setId(customerId);
        fallback.setFirstName("N/A");
        fallback.setLastName("(Servicio no disponible)");
        return fallback;
    }

    private LoanResponse mapToResponse(Loan loan, CustomerResponse customer) {
        LoanResponse response = new LoanResponse();
        response.setId(loan.getId());
        response.setCustomerId(loan.getCustomerId());
        response.setCustomerName(customer.getFirstName() + " " + customer.getLastName());
        response.setLoanTypeId(loan.getLoanType().getId());
        response.setLoanTypeName(loan.getLoanType().getName());
        response.setAmount(loan.getAmount());
        response.setApprovedAmount(loan.getApprovedAmount());
        response.setInterestRate(loan.getInterestRate());
        response.setTermMonths(loan.getTermMonths());
        response.setStatus(loan.getStatus());
        response.setPurpose(loan.getPurpose());
        response.setMonthlyPayment(loan.getMonthlyPayment());
        response.setTotalAmount(loan.getTotalAmount());
        response.setOutstandingBalance(loan.getOutstandingBalance());
        response.setApplicationDate(loan.getApplicationDate());
        response.setApprovalDate(loan.getApprovalDate());
        response.setDisbursementDate(loan.getDisbursementDate());
        response.setRejectionReason(loan.getRejectionReason());
        return response;
    }
}