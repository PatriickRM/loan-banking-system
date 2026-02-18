package com.service.repository;

import com.service.entity.CreditHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CreditHistoryRepository extends JpaRepository<CreditHistory, Long> {
    Optional<CreditHistory> findByCustomerId(Long customerId);
}
