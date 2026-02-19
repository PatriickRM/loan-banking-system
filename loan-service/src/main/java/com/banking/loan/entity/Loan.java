package com.banking.loan.entity;

import com.banking.loan.enums.LoanStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "loans")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Loan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long customerId;

    @ManyToOne
    @JoinColumn(name = "loan_type_id", nullable = false)
    private LoanType loanType;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(precision = 12, scale = 2)
    private BigDecimal approvedAmount;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal interestRate;

    @Column(nullable = false)
    private Integer termMonths;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LoanStatus status = LoanStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String purpose;

    @Column(precision = 10, scale = 2)
    private BigDecimal monthlyPayment;

    @Column(precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(precision = 12, scale = 2)
    private BigDecimal outstandingBalance;

    @CreationTimestamp
    private LocalDateTime applicationDate;

    private LocalDateTime approvalDate;

    private LocalDateTime rejectionDate;

    private LocalDateTime disbursementDate;

    private LocalDateTime completionDate;

    @Column(length = 100)
    private String evaluatedBy;

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}