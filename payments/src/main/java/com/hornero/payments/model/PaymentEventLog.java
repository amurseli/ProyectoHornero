package com.hornero.payments.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_event_log")
public class PaymentEventLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "entity_type", length = 20, nullable = false)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Column(name = "event_type", length = 50, nullable = false)
    private String eventType;

    @Column(name = "previous_status", length = 30)
    private String previousStatus;

    @Column(name = "new_status", length = 30)
    private String newStatus;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getEntityType() { return entityType; }
    public String getEntityId_str() { return String.valueOf(entityId); }
    public Long getEntityId() { return entityId; }
    public String getEventType() { return eventType; }
    public String getPreviousStatus() { return previousStatus; }
    public String getNewStatus() { return newStatus; }
    public String getMessage() { return message; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setEntityType(String entityType) { this.entityType = entityType; }
    public void setEntityId(Long entityId) { this.entityId = entityId; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public void setPreviousStatus(String previousStatus) { this.previousStatus = previousStatus; }
    public void setNewStatus(String newStatus) { this.newStatus = newStatus; }
    public void setMessage(String message) { this.message = message; }
}
