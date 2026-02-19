package com.banking.credit.repository;

import com.banking.credit.entity.CreditEvaluation;
import com.banking.credit.enums.EvaluationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CreditEvaluationRepository extends JpaRepository<CreditEvaluation, Long> {
    Optional<CreditEvaluation> findByLoanId(Long loanId);
    List<CreditEvaluation> findByCustomerId(Long customerId);
    List<CreditEvaluation> findByStatus(EvaluationStatus status);
}

