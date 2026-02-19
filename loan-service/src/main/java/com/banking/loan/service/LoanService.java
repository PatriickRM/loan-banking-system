package com.banking.loan.service;

import com.banking.loan.dto.*;
import com.banking.loan.enums.LoanStatus;

import java.util.List;

public interface LoanService {
    LoanResponse createLoan(LoanRequest request);
    LoanResponse getLoanById(Long id);
    List<LoanResponse> getLoansByCustomer(Long customerId);
    List<LoanResponse> getAllLoans();
    List<LoanResponse> getLoansByStatus(LoanStatus status);
    LoanResponse approveLoan(Long id, LoanApprovalRequest request);
    LoanResponse rejectLoan(Long id, LoanRejectionRequest request);
    LoanResponse disburseLoan(Long id);
}
