package com.banking.loan.event;

public record LoanRejectedEvent(
        Long loanId,
        Long customerId,
        String rejectionReason
) {}