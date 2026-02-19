package com.service.repository;

import com.service.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByDni(String dni);
    Optional<Customer> findByEmail(String email);
    boolean existsByDni(String dni);
    boolean existsByEmail(String email);
}

