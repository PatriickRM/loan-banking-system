package com.auth.service.client;

import com.auth.service.config.InternalFeignConfig;
import com.auth.service.dto.request.CustomerRequest;
import com.auth.service.dto.response.CustomerResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "customer-service", configuration = InternalFeignConfig.class)
public interface CustomerClient {

    @PostMapping("/api/customers")
    CustomerResponse createCustomer(@RequestBody CustomerRequest request);
}