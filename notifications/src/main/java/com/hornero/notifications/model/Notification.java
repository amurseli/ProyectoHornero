package com.hornero.notifications.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

// Notificacion in-app mostrada al usuario dentro de la aplicacion.
// Se crea al procesar un evento de campania o pago recibido por Redis Stream.
@Entity
@Table(name = "notification")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    // DONATION_SUCCESS | CAMPAIGN_SUCCEEDED_CONTRIBUTOR | CAMPAIGN_FAILED_CONTRIBUTOR
    // | CAMPAIGN_SUCCEEDED_CREATOR | CAMPAIGN_FAILED_CREATOR | PAYOUT_COMPLETED
    @Column(length = 50, nullable = false)
    private String type;

    @Column(length = 255, nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(name = "campaign_id")
    private Long campaignId;

    @Column(nullable = false)
    private Boolean read = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getType() { return type; }
    public String getTitle() { return title; }
    public String getMessage() { return message; }
    public Long getCampaignId() { return campaignId; }
    public Boolean getRead() { return read; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setUserId(Long userId) { this.userId = userId; }
    public void setType(String type) { this.type = type; }
    public void setTitle(String title) { this.title = title; }
    public void setMessage(String message) { this.message = message; }
    public void setCampaignId(Long campaignId) { this.campaignId = campaignId; }
    public void setRead(Boolean read) { this.read = read; }
}
