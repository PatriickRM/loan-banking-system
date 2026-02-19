package com.banking.credit.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class CustomerResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private BigDecimal monthlyIncome;
    private Integer workExperienceYears;
}
