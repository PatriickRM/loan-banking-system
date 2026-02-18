package com.service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "credit_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreditHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long customerId;

    private Integer creditScore;

    @Column(precision = 12, scale = 2)
    private BigDecimal totalDebt = BigDecimal.ZERO;

    private Integer activeLoans = 0;

    private Integer completedLoans = 0;

    private Integer defaultedLoans = 0;

    @UpdateTimestamp
    private LocalDateTime lastUpdated;
}

