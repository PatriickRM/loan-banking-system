package com.service.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class CustomerResponse {
    private Long id;
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
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
