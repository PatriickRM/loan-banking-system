package com.banking.payment.repository;

import com.banking.payment.entity.PaymentSchedule;
import com.banking.payment.enums.PaymentScheduleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface PaymentScheduleRepository extends JpaRepository<PaymentSchedule, Long> {
    List<PaymentSchedule> findByLoanIdOrderByInstallmentNumber(Long loanId);
    List<PaymentSchedule> findByStatus(PaymentScheduleStatus status);

    @Query("SELECT ps FROM PaymentSchedule ps WHERE ps.status = 'PENDING' AND ps.dueDate < :date")
    List<PaymentSchedule> findOverduePayments(LocalDate date);

    @Query("SELECT ps FROM PaymentSchedule ps WHERE ps.status = 'PENDING' AND ps.dueDate BETWEEN :startDate AND :endDate")
    List<PaymentSchedule> findUpcomingPayments(LocalDate startDate, LocalDate endDate);
}