package com.banking.credit.service;

import com.banking.credit.client.CustomerClient;
import com.banking.credit.dto.CreditHistoryResponse;
import com.banking.credit.dto.CustomerResponse;
import com.banking.credit.entity.EvaluationCriteria;
import com.banking.credit.entity.EvaluationDetail;
import com.banking.credit.enums.Recommendation;
import com.banking.credit.enums.RiskLevel;
import com.banking.credit.repository.EvaluationCriteriaRepository;
import com.banking.credit.repository.EvaluationDetailRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CreditScoringService {

    private final CustomerClient customerClient;
    private final EvaluationCriteriaRepository criteriaRepository;
    private final EvaluationDetailRepository detailRepository;

    public int calculateAutomaticScore(Long customerId, Long evaluationId) {
        CustomerResponse customer = customerClient.getCustomerById(customerId);
        CreditHistoryResponse history = customerClient.getCreditHistory(customerId);

        List<EvaluationCriteria> criteria = criteriaRepository.findByActiveTrue();
        List<EvaluationDetail> details = new ArrayList<>();

        BigDecimal totalScore = BigDecimal.ZERO;

        for (EvaluationCriteria criterion : criteria) {
            int score = calculateCriteriaScore(criterion, customer, history);
            BigDecimal weightedScore = BigDecimal.valueOf(score)
                    .multiply(criterion.getWeight())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            totalScore = totalScore.add(weightedScore);

            EvaluationDetail detail = new EvaluationDetail();
            detail.setEvaluationId(evaluationId);
            detail.setCriteria(criterion);
            detail.setScore(score);
            details.add(detail);
        }

        detailRepository.saveAll(details);

        return totalScore.intValue();
    }

    private int calculateCriteriaScore(EvaluationCriteria criterion,
                                       CustomerResponse customer,
                                       CreditHistoryResponse history) {
        return switch (criterion.getName()) {
            case "Ingresos Mensuales" -> scoreIncome(customer.getMonthlyIncome());
            case "Historial Crediticio" -> scoreCreditHistory(history);
            case "Capacidad de Pago" -> scorePaymentCapacity(customer, history);
            case "Antigüedad Laboral" -> scoreWorkExperience(customer.getWorkExperienceYears());
            default -> 50;
        };
    }

    private int scoreIncome(BigDecimal income) {
        if (income == null) return 0;
        if (income.compareTo(BigDecimal.valueOf(10000)) >= 0) return 100;
        if (income.compareTo(BigDecimal.valueOf(5000)) >= 0) return 70;
        if (income.compareTo(BigDecimal.valueOf(3000)) >= 0) return 50;
        if (income.compareTo(BigDecimal.valueOf(1500)) >= 0) return 30;
        return 10;
    }

    private int scoreCreditHistory(CreditHistoryResponse history) {
        int score = 50;

        // Préstamos completados suman
        score += Math.min(history.getCompletedLoans() * 15, 30);

        // Préstamos en mora restan
        score -= history.getDefaultedLoans() * 25;

        // Credit score influye
        if (history.getCreditScore() != null) {
            if (history.getCreditScore() >= 750) score += 20;
            else if (history.getCreditScore() >= 650) score += 10;
            else if (history.getCreditScore() < 550) score -= 20;
        }

        return Math.max(0, Math.min(100, score));
    }

    private int scorePaymentCapacity(CustomerResponse customer, CreditHistoryResponse history) {
        if (customer.getMonthlyIncome() == null || customer.getMonthlyIncome().compareTo(BigDecimal.ZERO) == 0) {
            return 0;
        }

        BigDecimal debtToIncome = history.getTotalDebt()
                .divide(customer.getMonthlyIncome(), 4, RoundingMode.HALF_UP);

        if (debtToIncome.compareTo(BigDecimal.valueOf(0.30)) <= 0) return 100;
        if (debtToIncome.compareTo(BigDecimal.valueOf(0.40)) <= 0) return 70;
        if (debtToIncome.compareTo(BigDecimal.valueOf(0.50)) <= 0) return 40;
        if (debtToIncome.compareTo(BigDecimal.valueOf(0.60)) <= 0) return 20;
        return 0;
    }

    private int scoreWorkExperience(Integer years) {
        if (years == null) return 0;
        if (years >= 10) return 100;
        if (years >= 5) return 75;
        if (years >= 3) return 50;
        if (years >= 1) return 25;
        return 10;
    }

    public Recommendation getRecommendation(int score) {
        if (score >= 75) return Recommendation.APPROVE;
        if (score >= 50) return Recommendation.MANUAL_REVIEW;
        return Recommendation.REJECT;
    }

    public RiskLevel getRiskLevel(int score) {
        if (score >= 75) return RiskLevel.LOW;
        if (score >= 50) return RiskLevel.MEDIUM;
        return RiskLevel.HIGH;
    }
}