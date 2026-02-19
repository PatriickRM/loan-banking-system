package com.banking.payment.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaConfig {

    @Bean
    public NewTopic loanDisbursedTopic() {
        return TopicBuilder.name("loan-disbursed")
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic paymentReceivedTopic() {
        return TopicBuilder.name("payment-received")
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic paymentOverdueTopic() {
        return TopicBuilder.name("payment-overdue")
                .partitions(3)
                .replicas(1)
                .build();
    }
}