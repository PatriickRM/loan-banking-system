package com.banking.credit.controller;

import com.banking.credit.dto.EvaluationRequest;
import com.banking.credit.dto.EvaluationResponse;
import com.banking.credit.dto.ManualEvaluationRequest;
import com.banking.credit.enums.EvaluationStatus;
import com.banking.credit.service.EvaluationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/evaluations")
@RequiredArgsConstructor
public class EvaluationController {

    private final EvaluationService evaluationService;

    // Solo el sistema interno (loan-service) crea evaluaciones automáticamente
    // ANALISTA puede crear evaluaciones manuales
    @PostMapping
    @PreAuthorize("hasAnyRole('ANALISTA', 'ADMIN')")
    public ResponseEntity<EvaluationResponse> createEvaluation(@Valid @RequestBody EvaluationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(evaluationService.createEvaluation(request));
    }

    // ANALISTA y ADMIN ven evaluaciones por ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ANALISTA', 'ADMIN')")
    public ResponseEntity<EvaluationResponse> getEvaluationById(@PathVariable Long id) {
        return ResponseEntity.ok(evaluationService.getEvaluationById(id));
    }

    // ANALISTA y ADMIN ven la evaluación de un préstamo específico
    @GetMapping("/loan/{loanId}")
    @PreAuthorize("hasAnyRole('ANALISTA', 'ADMIN')")
    public ResponseEntity<EvaluationResponse> getEvaluationByLoanId(@PathVariable Long loanId) {
        return ResponseEntity.ok(evaluationService.getEvaluationByLoanId(loanId));
    }

    // Solo ANALISTA y ADMIN filtran evaluaciones por estado
    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('ANALISTA', 'ADMIN')")
    public ResponseEntity<List<EvaluationResponse>> getEvaluationsByStatus(@PathVariable EvaluationStatus status) {
        return ResponseEntity.ok(evaluationService.getEvaluationsByStatus(status));
    }

    // Solo ANALISTA completa evaluaciones manuales
    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ANALISTA', 'ADMIN')")
    public ResponseEntity<EvaluationResponse> completeManualEvaluation(
            @PathVariable Long id,
            @Valid @RequestBody ManualEvaluationRequest request) {
        return ResponseEntity.ok(evaluationService.completeManualEvaluation(id, request));
    }
}