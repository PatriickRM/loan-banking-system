package com.service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "customer_documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerDocument {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private Long customerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private DocumentType documentType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String documentUrl;

    @CreationTimestamp
    private LocalDateTime uploadDate;

    private Boolean verified = false;

    private LocalDateTime verifiedAt;

    @Column(length = 100)
    private String verifiedBy;
}
