package com.hornero.notifications.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

// Auditoria de los mails enviados por el servicio: que se mando, a quien y si fallo.
@Entity
@Table(name = "email_log")
public class EmailLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", length = 100, nullable = false)
    private String eventId;

    @Column(name = "recipient_email", length = 255, nullable = false)
    private String recipientEmail;

    @Column(length = 50, nullable = false)
    private String type;

    // SENT | FAILED
    @Column(length = 20, nullable = false)
    private String status;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "sent_at", nullable = false, updatable = false)
    private LocalDateTime sentAt;

    @PrePersist
    protected void onCreate() {
        sentAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getEventId() { return eventId; }
    public String getRecipientEmail() { return recipientEmail; }
    public String getType() { return type; }
    public String getStatus() { return status; }
    public String getErrorMessage() { return errorMessage; }
    public LocalDateTime getSentAt() { return sentAt; }

    public void setEventId(String eventId) { this.eventId = eventId; }
    public void setRecipientEmail(String recipientEmail) { this.recipientEmail = recipientEmail; }
    public void setType(String type) { this.type = type; }
    public void setStatus(String status) { this.status = status; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
}
