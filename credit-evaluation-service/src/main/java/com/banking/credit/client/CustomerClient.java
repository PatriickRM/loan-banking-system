package com.banking.credit.client;

import com.banking.credit.config.FeignConfig;
import com.banking.credit.dto.CreditHistoryResponse;
import com.banking.credit.dto.CustomerResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "customer-service", configuration = FeignConfig.class)
public interface CustomerClient {

    @GetMapping("/api/customers/{id}")
    CustomerResponse getCustomerById(@PathVariable Long id);

    @GetMapping("/api/customers/{id}/credit-history")
    CreditHistoryResponse getCreditHistory(@PathVariable Long id);
}
