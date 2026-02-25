package com.banking.payment.client;

import com.banking.payment.config.FeignConfig;
import com.banking.payment.dto.LoanResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "loan-service", configuration = FeignConfig.class)
public interface LoanClient {
    @GetMapping("/api/loans/{id}")
    LoanResponse getLoanById(@PathVariable Long id);
}