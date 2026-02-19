package com.banking.credit.service;

import com.banking.credit.dto.*;
import com.banking.credit.entity.CreditEvaluation;
import com.banking.credit.enums.EvaluationStatus;
import com.banking.credit.enums.Recommendation;
import com.banking.credit.event.EvaluationCompletedEvent;
import com.banking.credit.repository.CreditEvaluationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EvaluationService {

    private final CreditEvaluationRepository evaluationRepository;
    private final CreditScoringService scoringService;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Transactional
    public EvaluationResponse createEvaluation(EvaluationRequest request) {
        // Verificar si ya existe evaluación
        if (evaluationRepository.findByLoanId(request.getLoanId()).isPresent()) {
            throw new RuntimeException("Ya existe una evaluación para este préstamo");
        }

        CreditEvaluation evaluation = new CreditEvaluation();
        evaluation.setCustomerId(request.getCustomerId());
        evaluation.setLoanId(request.getLoanId());
        evaluation.setStatus(EvaluationStatus.PENDING);

        evaluation = evaluationRepository.save(evaluation);

        // Calcular score automático
        int automaticScore = scoringService.calculateAutomaticScore(
                request.getCustomerId(),
                evaluation.getId()
        );

        evaluation.setAutomaticScore(automaticScore);
        evaluation.setFinalScore(automaticScore);
        evaluation.setRecommendation(scoringService.getRecommendation(automaticScore));
        evaluation.setRiskLevel(scoringService.getRiskLevel(automaticScore));

        // Si requiere revisión manual, cambiar estado
        if (evaluation.getRecommendation().equals(Recommendation.MANUAL_REVIEW)) {
            evaluation.setStatus(EvaluationStatus.IN_REVIEW);
        } else {
            evaluation.setStatus(EvaluationStatus.APPROVED);
            evaluation.setCompletedDate(LocalDateTime.now());

            // Publicar evento
            publishEvaluationCompleted(evaluation);
        }

        evaluation = evaluationRepository.save(evaluation);

        return mapToResponse(evaluation);
    }

    @Transactional
    public EvaluationResponse completeManualEvaluation(Long id, ManualEvaluationRequest request) {
        CreditEvaluation evaluation = evaluationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Evaluación no encontrada"));

        if (evaluation.getStatus() != EvaluationStatus.IN_REVIEW) {
            throw new RuntimeException("Solo se pueden completar evaluaciones en revisión");
        }

        evaluation.setManualScore(request.getManualScore());
        evaluation.setEvaluatorId(request.getEvaluatorId());
        evaluation.setEvaluatorName(request.getEvaluatorName());
        evaluation.setComments(request.getComments());

        // Promedio de scores
        int finalScore = (evaluation.getAutomaticScore() + request.getManualScore()) / 2;
        evaluation.setFinalScore(finalScore);
        evaluation.setRecommendation(scoringService.getRecommendation(finalScore));
        evaluation.setRiskLevel(scoringService.getRiskLevel(finalScore));
        evaluation.setStatus(EvaluationStatus.APPROVED);
        evaluation.setCompletedDate(LocalDateTime.now());

        evaluation = evaluationRepository.save(evaluation);

        // Publicar evento
        publishEvaluationCompleted(evaluation);

        return mapToResponse(evaluation);
    }

    @Transactional(readOnly = true)
    public EvaluationResponse getEvaluationById(Long id) {
        CreditEvaluation evaluation = evaluationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Evaluación no encontrada"));
        return mapToResponse(evaluation);
    }

    @Transactional(readOnly = true)
    public EvaluationResponse getEvaluationByLoanId(Long loanId) {
        CreditEvaluation evaluation = evaluationRepository.findByLoanId(loanId)
                .orElseThrow(() -> new RuntimeException("Evaluación no encontrada"));
        return mapToResponse(evaluation);
    }

    @Transactional(readOnly = true)
    public List<EvaluationResponse> getEvaluationsByStatus(EvaluationStatus status) {
        return evaluationRepository.findByStatus(status).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private void publishEvaluationCompleted(CreditEvaluation evaluation) {
        EvaluationCompletedEvent event = new EvaluationCompletedEvent(
                evaluation.getId(),
                evaluation.getLoanId(),
                evaluation.getCustomerId(),
                evaluation.getFinalScore(),
                evaluation.getRecommendation(),
                LocalDateTime.now()
        );

        kafkaTemplate.send("evaluation-completed", event);
        log.info("Published evaluation completed event for loan: {}", evaluation.getLoanId());
    }

    private EvaluationResponse mapToResponse(CreditEvaluation evaluation) {
        EvaluationResponse response = new EvaluationResponse();
        response.setId(evaluation.getId());
        response.setCustomerId(evaluation.getCustomerId());
        response.setLoanId(evaluation.getLoanId());
        response.setAutomaticScore(evaluation.getAutomaticScore());
        response.setManualScore(evaluation.getManualScore());
        response.setFinalScore(evaluation.getFinalScore());
        response.setCreditScore(evaluation.getCreditScore());
        response.setStatus(evaluation.getStatus());
        response.setRecommendation(evaluation.getRecommendation());
        response.setRiskLevel(evaluation.getRiskLevel());
        response.setComments(evaluation.getComments());
        response.setEvaluationDate(evaluation.getEvaluationDate());
        response.setCompletedDate(evaluation.getCompletedDate());
        return response;
    }
}