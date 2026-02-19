package com.banking.payment.dto;

import com.banking.payment.enums.PaymentMethod;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PaymentRequest {
    @NotNull(message = "Loan ID es requerido")
    private Long loanId;

    @NotNull(message = "Monto es requerido")
    @DecimalMin(value = "0.01", message = "Monto debe ser mayor a 0")
    private BigDecimal amount;

    @NotNull(message = "Método de pago es requerido")
    private PaymentMethod paymentMethod;

    private String referenceNumber;

    private String notes;

    private String processedBy;
}