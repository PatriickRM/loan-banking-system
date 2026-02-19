package com.banking.credit.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "evaluation_details")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long evaluationId;

    @ManyToOne
    @JoinColumn(name = "criteria_id", nullable = false)
    private EvaluationCriteria criteria;

    @Column(nullable = false)
    private Integer score;

    @Column(columnDefinition = "TEXT")
    private String comments;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
