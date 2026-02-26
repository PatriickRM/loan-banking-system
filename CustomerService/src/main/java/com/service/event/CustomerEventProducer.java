package com.service.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class CustomerEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void sendCustomerCreated(CustomerCreatedEvent event) {
        kafkaTemplate.send("customer-created", String.valueOf(event.customerId()), event);
        log.info("Evento CustomerCreated enviado para customerId={}, email={}",
                event.customerId(), event.email());
    }
}