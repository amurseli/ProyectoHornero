package com.hornero.notifications.dto;

import java.time.LocalDateTime;

public class NotificationResponse {

    private Long id;
    private String type;
    private String title;
    private String message;
    private Long campaignId;
    private boolean read;
    private LocalDateTime createdAt;

    public NotificationResponse(Long id, String type, String title, String message,
                                 Long campaignId, boolean read, LocalDateTime createdAt) {
        this.id = id;
        this.type = type;
        this.title = title;
        this.message = message;
        this.campaignId = campaignId;
        this.read = read;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public String getType() { return type; }
    public String getTitle() { return title; }
    public String getMessage() { return message; }
    public Long getCampaignId() { return campaignId; }
    public boolean isRead() { return read; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
