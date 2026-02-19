package com.banking.payment.entity;

import com.banking.payment.enums.PaymentMethod;
import com.banking.payment.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long loanId;

    private Long scheduleId;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private PaymentMethod paymentMethod;

    @Column(unique = true, length = 100)
    private String transactionId;

    @Column(precision = 10, scale = 2)
    private BigDecimal principalPaid;

    @Column(precision = 10, scale = 2)
    private BigDecimal interestPaid;

    @Column(precision = 10, scale = 2)
    private BigDecimal lateFee = BigDecimal.ZERO;

    @Column(nullable = false)
    private LocalDateTime paymentDate;

    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentStatus status = PaymentStatus.COMPLETED;

    @Column(length = 100)
    private String referenceNumber;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(length = 100)
    private String processedBy;

    @CreationTimestamp
    private LocalDateTime createdAt;
}