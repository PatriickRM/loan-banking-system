package com.service.controller;

import com.service.dto.request.CustomerRequest;
import com.service.dto.response.CreditHistoryResponse;
import com.service.dto.response.CustomerResponse;
import com.service.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    // Solo ADMIN puede crear clientes directamente
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CustomerResponse> createCustomer(@Valid @RequestBody CustomerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(customerService.createCustomer(request));
    }

    // ADMIN y ANALISTA ven cualquier cliente
    // CLIENTE solo puede ver su propio perfil
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALISTA') or authentication.name == @customerService.getCustomerById(#id).email")
    public ResponseEntity<CustomerResponse> getCustomerById(@PathVariable Long id) {
        return ResponseEntity.ok(customerService.getCustomerById(id));
    }

    // Solo ANALISTA y ADMIN buscan por DNI (para evaluación crediticia)
    @GetMapping("/dni/{dni}")
    @PreAuthorize("hasAnyRole('ANALISTA', 'ADMIN')")
    public ResponseEntity<CustomerResponse> getCustomerByDni(@PathVariable String dni) {
        return ResponseEntity.ok(customerService.getCustomerByDni(dni));
    }

    // Solo ADMIN y ANALISTA ven la lista completa
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALISTA')")
    public ResponseEntity<List<CustomerResponse>> getAllCustomers() {
        return ResponseEntity.ok(customerService.getAllCustomers());
    }

    // ADMIN actualiza cualquier cliente
    // CLIENTE solo puede actualizarse a sí mismo
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or authentication.name == @customerService.getCustomerById(#id).email")
    public ResponseEntity<CustomerResponse> updateCustomer(
            @PathVariable Long id,
            @Valid @RequestBody CustomerRequest request) {
        return ResponseEntity.ok(customerService.updateCustomer(id, request));
    }

    // Solo ADMIN elimina
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCustomer(@PathVariable Long id) {
        customerService.deleteCustomer(id);
        return ResponseEntity.noContent().build();
    }

    // ADMIN, ANALISTA y el propio cliente pueden ver su historial
    @GetMapping("/{id}/credit-history")
    @   PreAuthorize("hasAnyRole('ADMIN', 'ANALISTA') or authentication.name == @customerService.getCustomerById(#id).email")
    public ResponseEntity<CreditHistoryResponse> getCreditHistory(@PathVariable Long id) {
        return ResponseEntity.ok(customerService.getCreditHistory(id));
    }
}
