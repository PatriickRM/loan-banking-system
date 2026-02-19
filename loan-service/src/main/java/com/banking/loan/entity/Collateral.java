package com.banking.loan.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "collaterals")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Collateral {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long loanId;

    @Column(nullable = false, length = 50)
    private String collateralType; // PROPERTY, VEHICLE, INVESTMENT, OTHER

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal estimatedValue;

    @Column(precision = 12, scale = 2)
    private BigDecimal appraisalValue;

    private LocalDate appraisalDate;

    @Column(length = 100)
    private String registrationNumber;

    @CreationTimestamp
    private LocalDateTime createdAt;
}