package com.banking.payment.controller;

import com.banking.payment.dto.PaymentRequest;
import com.banking.payment.dto.PaymentResponse;
import com.banking.payment.dto.PaymentScheduleResponse;
import com.banking.payment.service.PaymentScheduleService;
import com.banking.payment.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final PaymentScheduleService scheduleService;

    @PostMapping
    public ResponseEntity<PaymentResponse> processPayment(@Valid @RequestBody PaymentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(paymentService.processPayment(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentResponse> getPaymentById(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.getPaymentById(id));
    }

    @GetMapping("/loan/{loanId}")
    public ResponseEntity<List<PaymentResponse>> getPaymentsByLoan(@PathVariable Long loanId) {
        return ResponseEntity.ok(paymentService.getPaymentsByLoan(loanId));
    }

    @GetMapping("/schedule/loan/{loanId}")
    public ResponseEntity<List<PaymentScheduleResponse>> getScheduleByLoan(@PathVariable Long loanId) {
        return ResponseEntity.ok(scheduleService.getScheduleByLoan(loanId));
    }

    @GetMapping("/schedule/upcoming")
    public ResponseEntity<List<PaymentScheduleResponse>> getUpcomingPayments(
            @RequestParam(defaultValue = "7") int daysAhead) {
        return ResponseEntity.ok(scheduleService.getUpcomingPayments(daysAhead));
    }

    @GetMapping("/schedule/overdue")
    public ResponseEntity<List<PaymentScheduleResponse>> getOverduePayments() {
        return ResponseEntity.ok(scheduleService.getOverduePayments());
    }
}