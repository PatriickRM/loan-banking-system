package com.banking.payment.service;

import com.banking.payment.dto.LoanResponse;
import com.banking.payment.dto.PaymentScheduleResponse;
import com.banking.payment.entity.PaymentSchedule;
import com.banking.payment.enums.PaymentScheduleStatus;
import com.banking.payment.repository.PaymentScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentScheduleService {

    private final PaymentScheduleRepository scheduleRepository;

    @Transactional
    public List<PaymentScheduleResponse> generateSchedule(LoanResponse loan, LocalDate startDate) {
        List<PaymentSchedule> schedules = new ArrayList<>();

        BigDecimal monthlyRate = loan.getInterestRate()
                .divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP)
                .divide(BigDecimal.valueOf(12), 6, RoundingMode.HALF_UP);

        BigDecimal balance = loan.getAmount();
        BigDecimal monthlyPayment = loan.getMonthlyPayment();

        for (int i = 1; i <= loan.getTermMonths(); i++) {
            BigDecimal interest = balance.multiply(monthlyRate)
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal principal = monthlyPayment.subtract(interest);

            // Ajuste para última cuota
            if (i == loan.getTermMonths()) {
                principal = balance;
                monthlyPayment = principal.add(interest);
            }

            balance = balance.subtract(principal);

            PaymentSchedule schedule = new PaymentSchedule();
            schedule.setLoanId(loan.getId());
            schedule.setInstallmentNumber(i);
            schedule.setAmount(monthlyPayment);
            schedule.setPrincipal(principal);
            schedule.setInterest(interest);
            schedule.setRemainingBalance(balance.max(BigDecimal.ZERO));
            schedule.setDueDate(startDate.plusMonths(i));
            schedule.setStatus(PaymentScheduleStatus.PENDING);

            schedules.add(schedule);
        }

        scheduleRepository.saveAll(schedules);

        return schedules.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PaymentScheduleResponse> getScheduleByLoan(Long loanId) {
        return scheduleRepository.findByLoanIdOrderByInstallmentNumber(loanId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PaymentScheduleResponse> getUpcomingPayments(int daysAhead) {
        LocalDate today = LocalDate.now();
        LocalDate endDate = today.plusDays(daysAhead);

        return scheduleRepository.findUpcomingPayments(today, endDate).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PaymentScheduleResponse> getOverduePayments() {
        return scheduleRepository.findOverduePayments(LocalDate.now()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateScheduleStatus(Long scheduleId, PaymentScheduleStatus status) {
        PaymentSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Cronograma no encontrado"));
        schedule.setStatus(status);
        scheduleRepository.save(schedule);
    }

    private PaymentScheduleResponse mapToResponse(PaymentSchedule schedule) {
        PaymentScheduleResponse response = new PaymentScheduleResponse();
        response.setId(schedule.getId());
        response.setLoanId(schedule.getLoanId());
        response.setInstallmentNumber(schedule.getInstallmentNumber());
        response.setAmount(schedule.getAmount());
        response.setPrincipal(schedule.getPrincipal());
        response.setInterest(schedule.getInterest());
        response.setRemainingBalance(schedule.getRemainingBalance());
        response.setDueDate(schedule.getDueDate());
        response.setStatus(schedule.getStatus());

        LocalDate today = LocalDate.now();
        long daysUntil = ChronoUnit.DAYS.between(today, schedule.getDueDate());
        response.setDaysUntilDue((int) daysUntil);
        response.setIsOverdue(schedule.getDueDate().isBefore(today) &&
                schedule.getStatus() == PaymentScheduleStatus.PENDING);

        return response;
    }
}