package com.banking.loan.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class LoanRequest {
    private Long customerId;

    @NotNull(message = "Tipo de préstamo es requerido")
    private Long loanTypeId;

    @NotNull(message = "Monto es requerido")
    @DecimalMin(value = "1000.0", message = "Monto mínimo es 1000")
    private BigDecimal amount;

    @NotNull(message = "Plazo es requerido")
    @Min(value = 6, message = "Plazo mínimo es 6 meses")
    @Max(value = 360, message = "Plazo máximo es 360 meses")
    private Integer termMonths;

    @NotBlank(message = "Propósito del préstamo es requerido")
    @Size(max = 500)
    private String purpose;
}