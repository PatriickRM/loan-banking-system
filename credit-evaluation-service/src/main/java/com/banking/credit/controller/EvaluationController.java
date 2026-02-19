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
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/evaluations")
@RequiredArgsConstructor
public class EvaluationController {

    private final EvaluationService evaluationService;

    @PostMapping
    public ResponseEntity<EvaluationResponse> createEvaluation(@Valid @RequestBody EvaluationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(evaluationService.createEvaluation(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EvaluationResponse> getEvaluationById(@PathVariable Long id) {
        return ResponseEntity.ok(evaluationService.getEvaluationById(id));
    }

    @GetMapping("/loan/{loanId}")
    public ResponseEntity<EvaluationResponse> getEvaluationByLoanId(@PathVariable Long loanId) {
        return ResponseEntity.ok(evaluationService.getEvaluationByLoanId(loanId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<EvaluationResponse>> getEvaluationsByStatus(@PathVariable EvaluationStatus status) {
        return ResponseEntity.ok(evaluationService.getEvaluationsByStatus(status));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<EvaluationResponse> completeManualEvaluation(@PathVariable Long id, @Valid @RequestBody ManualEvaluationRequest request) {
        return ResponseEntity.ok(evaluationService.completeManualEvaluation(id, request));
    }
}

