package com.auth.service.dto.request;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CustomerRequest {
    private String dni;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private LocalDate dateOfBirth;
    private String address;
    private String city;
    private String country;
    private BigDecimal monthlyIncome;
    private Integer workExperienceYears;
    private String occupation;
    private String employerName;
    private String documentType;
}