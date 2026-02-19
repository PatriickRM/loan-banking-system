package com.banking.notification.repository;

import com.banking.notification.entity.Notification;
import com.banking.notification.enums.NotificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserId(Long userId);
    List<Notification> findByStatus(NotificationStatus status);
    List<Notification> findByStatusAndRetryCountLessThan(NotificationStatus status, Integer maxRetries);
}