package com.banking.loan.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class CustomerResponse {
    private Long id;
    private String dni;
    private String firstName;
    private String lastName;
    private String email;
    private BigDecimal monthlyIncome;
    private Integer workExperienceYears;
}