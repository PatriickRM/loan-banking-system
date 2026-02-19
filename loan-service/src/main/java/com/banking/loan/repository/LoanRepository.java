package com.banking.loan.repository;

import com.banking.loan.entity.Loan;
import com.banking.loan.enums.LoanStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoanRepository extends JpaRepository<Loan, Long> {
    List<Loan> findByCustomerId(Long customerId);
    List<Loan> findByStatus(LoanStatus status);
    Long countByCustomerIdAndStatus(Long customerId, LoanStatus status);
}