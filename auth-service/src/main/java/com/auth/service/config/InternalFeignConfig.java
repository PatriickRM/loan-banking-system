package com.auth.service.config;

import feign.RequestInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class InternalFeignConfig {

    @Value("${service.internal-token}")
    private String internalToken;

    @Bean
    public RequestInterceptor internalRequestInterceptor() {
        return requestTemplate ->
                requestTemplate.header("Authorization", "Bearer " + internalToken);
    }
}