package com.auth.service.event;

import com.auth.service.entity.User;
import com.auth.service.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class CustomerEventConsumer {

    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "customer-created", groupId = "auth-service")
    public void handleCustomerCreated(String message) {
        try {
            CustomerCreatedEvent event = objectMapper.readValue(message, CustomerCreatedEvent.class);
            log.info("Evento CustomerCreated recibido: customerId={}, email={}",
                    event.customerId(), event.email());

            userRepository.findByEmail(event.email()).ifPresentOrElse(
                    user -> {
                        user.setCustomerId(event.customerId());
                        userRepository.save(user);
                        log.info("CustomerId={} vinculado al user con email={}",
                                event.customerId(), event.email());
                    },
                    () -> log.warn("No se encontró user con email={} para vincular customerId={}",
                            event.email(), event.customerId())
            );
        } catch (Exception e) {
            log.error("Error procesando CustomerCreatedEvent: {}", e.getMessage(), e);
        }
    }
}