package com.banking.payment.entity;

import com.banking.payment.enums.PaymentScheduleStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_schedules")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long loanId;

    @Column(nullable = false)
    private Integer installmentNumber;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal principal;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal interest;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal remainingBalance;

    @Column(nullable = false)
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentScheduleStatus status = PaymentScheduleStatus.PENDING;

    @CreationTimestamp
    private LocalDateTime createdAt;
}