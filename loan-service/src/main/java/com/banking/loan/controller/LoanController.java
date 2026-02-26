package com.banking.loan.controller;

import com.banking.loan.dto.*;
import com.banking.loan.enums.LoanStatus;
import com.banking.loan.service.LoanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/loans")
@RequiredArgsConstructor
public class LoanController {

    private final LoanService loanService;

    // CLIENTE solicita su propio préstamo
    @PostMapping
    @PreAuthorize("hasRole('CLIENTE')")
    public ResponseEntity<LoanResponse> createLoan(@Valid @RequestBody LoanRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(loanService.createLoan(request));
    }

    // ANALISTA y ADMIN ven cualquier préstamo por ID
    // CLIENTE solo puede ver si el préstamo le pertenece (se valida en service)
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ANALISTA', 'ADMIN', 'CLIENTE')")
    public ResponseEntity<LoanResponse> getLoanById(@PathVariable Long id) {
        return ResponseEntity.ok(loanService.getLoanById(id));
    }

    // ANALISTA y ADMIN ven préstamos de cualquier cliente
    // CLIENTE solo puede ver los suyos
    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasAnyRole('ANALISTA', 'ADMIN', 'CLIENTE')")
    public ResponseEntity<List<LoanResponse>> getLoansByCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(loanService.getLoansByCustomer(customerId));
    }

    // Solo ANALISTA y ADMIN ven todos los préstamos
    @GetMapping
    @PreAuthorize("hasAnyRole('ANALISTA', 'ADMIN')")
    public ResponseEntity<List<LoanResponse>> getAllLoans() {
        return ResponseEntity.ok(loanService.getAllLoans());
    }

    // Solo ANALISTA y ADMIN filtran por estado
    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('ANALISTA', 'ADMIN')")
    public ResponseEntity<List<LoanResponse>> getLoansByStatus(@PathVariable LoanStatus status) {
        return ResponseEntity.ok(loanService.getLoansByStatus(status));
    }

    // Solo ANALISTA y ADMIN aprueban
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ANALISTA', 'ADMIN')")
    public ResponseEntity<LoanResponse> approveLoan(
            @PathVariable Long id,
            @Valid @RequestBody LoanApprovalRequest request) {
        return ResponseEntity.ok(loanService.approveLoan(id, request));
    }

    // Solo ANALISTA y ADMIN rechazan
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ANALISTA', 'ADMIN')")
    public ResponseEntity<LoanResponse> rejectLoan(
            @PathVariable Long id,
            @Valid @RequestBody LoanRejectionRequest request) {
        return ResponseEntity.ok(loanService.rejectLoan(id, request));
    }

    // Solo ADMIN desembolsa
    @PostMapping("/{id}/disburse")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LoanResponse> disburseLoan(@PathVariable Long id) {
        return ResponseEntity.ok(loanService.disburseLoan(id));
    }
}