package com.banking.credit.repository;

import com.banking.credit.entity.EvaluationCriteria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EvaluationCriteriaRepository extends JpaRepository<EvaluationCriteria, Long> {
    List<EvaluationCriteria> findByActiveTrue();
}
