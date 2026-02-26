package com.auth.service.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class RegisterRequest {

    // ── Datos de autenticación ──────────────────────────────────────────
    @NotBlank(message = "Username es requerido")
    private String username;

    @NotBlank(message = "Email es requerido")
    @Email(message = "Email inválido")
    private String email;

    @NotBlank(message = "Password es requerido")
    @Size(min = 8, message = "Password debe tener al menos 8 caracteres")
    private String password;

    // ── Datos de cliente (CustomerRequest) ────────────────────────────
    @NotBlank(message = "DNI es requerido")
    @Size(min = 8, max = 20)
    private String dni;

    @NotBlank(message = "Nombre es requerido")
    @Size(max = 100)
    private String firstName;

    @NotBlank(message = "Apellido es requerido")
    @Size(max = 100)
    private String lastName;

    @Pattern(regexp = "^[0-9]{9,20}$", message = "Teléfono inválido")
    private String phone;

    @NotNull(message = "Fecha de nacimiento es requerida")
    @Past(message = "Fecha de nacimiento debe ser en el pasado")
    private LocalDate dateOfBirth;

    private String address;
    private String city;
    private String country = "Perú";

    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal monthlyIncome;

    @Min(0)
    private Integer workExperienceYears = 0;

    private String occupation;
    private String employerName;

    private String documentType;
}