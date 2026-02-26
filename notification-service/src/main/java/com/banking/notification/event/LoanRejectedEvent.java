package com.banking.notification.event;

public record LoanRejectedEvent(
        Long loanId,
        Long customerId,
        String rejectionReason
) {}