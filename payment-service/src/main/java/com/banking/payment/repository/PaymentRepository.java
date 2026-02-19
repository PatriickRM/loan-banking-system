package com.banking.payment.repository;

import com.banking.payment.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByLoanIdOrderByPaymentDateDesc(Long loanId);
}