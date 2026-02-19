package com.banking.credit.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class CreditHistoryResponse {
    private Long customerId;
    private Integer creditScore;
    private BigDecimal totalDebt;
    private Integer activeLoans;
    private Integer completedLoans;
    private Integer defaultedLoans;
}
