package com.banking.loan.controller;

import com.banking.loan.dto.*;
import com.banking.loan.enums.LoanStatus;
import com.banking.loan.service.LoanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/loans")
@RequiredArgsConstructor
public class LoanController {
    private final LoanService loanService;

    @PostMapping
    public ResponseEntity<LoanResponse> createLoan(@Valid @RequestBody LoanRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(loanService.createLoan(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LoanResponse> getLoanById(@PathVariable Long id) {
        return ResponseEntity.ok(loanService.getLoanById(id));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<LoanResponse>> getLoansByCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(loanService.getLoansByCustomer(customerId));
    }

    @GetMapping
    public ResponseEntity<List<LoanResponse>> getAllLoans() {
        return ResponseEntity.ok(loanService.getAllLoans());
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<LoanResponse>> getLoansByStatus(@PathVariable LoanStatus status) {
        return ResponseEntity.ok(loanService.getLoansByStatus(status));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<LoanResponse> approveLoan(
            @PathVariable Long id,
            @Valid @RequestBody LoanApprovalRequest request) {
        return ResponseEntity.ok(loanService.approveLoan(id, request));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<LoanResponse> rejectLoan(
            @PathVariable Long id,
            @Valid @RequestBody LoanRejectionRequest request) {
        return ResponseEntity.ok(loanService.rejectLoan(id, request));
    }

    @PostMapping("/{id}/disburse")
    public ResponseEntity<LoanResponse> disburseLoan(@PathVariable Long id) {
        return ResponseEntity.ok(loanService.disburseLoan(id));
    }
}