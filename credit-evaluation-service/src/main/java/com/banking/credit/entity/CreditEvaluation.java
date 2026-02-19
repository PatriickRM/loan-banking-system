package com.banking.credit.entity;

import com.banking.credit.enums.EvaluationStatus;
import com.banking.credit.enums.Recommendation;
import com.banking.credit.enums.RiskLevel;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "credit_evaluations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreditEvaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long customerId;

    @Column(nullable = false)
    private Long loanId;

    private Integer automaticScore;

    private Integer manualScore;

    private Integer finalScore;

    private Integer creditScore;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EvaluationStatus status = EvaluationStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Recommendation recommendation;

    @Column(length = 100)
    private String evaluatorId;

    @Column(length = 200)
    private String evaluatorName;

    @Column(columnDefinition = "TEXT")
    private String comments;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private RiskLevel riskLevel;

    @CreationTimestamp
    private LocalDateTime evaluationDate;

    private LocalDateTime completedDate;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}