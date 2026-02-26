package com.service.event;

public record CustomerCreatedEvent(
        Long customerId,
        String email
) {}