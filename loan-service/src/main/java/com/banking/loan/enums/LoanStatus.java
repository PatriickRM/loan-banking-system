package com.banking.loan.enums;

public enum LoanStatus {
    PENDING,      //En evaluación
    APPROVED,     //Aprobado (aún no desembolsado)
    REJECTED,     //Rechazado
    ACTIVE,       //Desembolsado y activo
    COMPLETED,    //Pagado completamente
    DEFAULTED,    //En mora
    CANCELLED     //Cancelado
}