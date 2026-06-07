package com.hornero.notifications.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

// Marca de eventos del Redis Stream ya procesados.
// El consumer group entrega los mensajes con semantica at-least-once: este registro
// evita duplicar notificaciones o reenviar mails ante reintentos del mismo evento.
@Entity
@Table(name = "processed_event")
public class ProcessedEvent {

    @Id
    @Column(name = "event_id", length = 100)
    private String eventId;

    @Column(name = "processed_at", nullable = false, updatable = false)
    private LocalDateTime processedAt;

    @PrePersist
    protected void onCreate() {
        processedAt = LocalDateTime.now();
    }

    public ProcessedEvent() {}

    public ProcessedEvent(String eventId) {
        this.eventId = eventId;
    }

    public String getEventId() { return eventId; }
    public LocalDateTime getProcessedAt() { return processedAt; }

    public void setEventId(String eventId) { this.eventId = eventId; }
}
