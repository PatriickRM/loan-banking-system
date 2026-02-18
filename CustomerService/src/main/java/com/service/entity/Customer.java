package com.service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "customers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true, nullable = false, length = 20)
    private String dni;
    @Column(nullable = false, length = 100)
    private String firstName;
    @Column(nullable = false, length = 100)
    private String lastName;
    @Column(unique = true, nullable = false, length = 150)
    private String email;
    @Column(length = 20)
    private String phone;
    @Column(nullable = false)
    private LocalDate dateOfBirth;
    @Column(columnDefinition = "TEXT")
    private String address;
    @Column(length = 100)
    private String city;
    @Column(length = 100)
    private String country = "Perú";
    @Column(precision = 12, scale = 2)
    private BigDecimal monthlyIncome;

    private Integer workExperienceYears = 0;

    @Column(length = 150)
    private String occupation;
    @Column(length = 200)
    private String employerName;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}

