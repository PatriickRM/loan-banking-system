package com.auth.service.event;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record CustomerCreatedEvent(
        Long customerId,
        String email
) {}
