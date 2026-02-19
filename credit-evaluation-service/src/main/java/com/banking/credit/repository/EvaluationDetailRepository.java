package com.banking.credit.repository;

import com.banking.credit.entity.EvaluationDetail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EvaluationDetailRepository extends JpaRepository<EvaluationDetail, Long> {
    List<EvaluationDetail> findByEvaluationId(Long evaluationId);
}
