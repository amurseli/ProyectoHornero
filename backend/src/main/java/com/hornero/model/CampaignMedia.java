package com.hornero.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "campaign_media")
public class CampaignMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_campaign", nullable = false)
    private Campaign campaign;

    @Column(name = "media_type", nullable = false, length = 10)
    private String mediaType;

    @Column(length = 1000)
    private String url;

    @Column(name = "base64_data", columnDefinition = "TEXT")
    private String base64Data;

    @Column(name = "s3_key", length = 500)
    private String s3Key;

    @Column(name = "is_primary")
    private Boolean isPrimary = false;

    @Column(name = "display_order")
    private Integer displayOrder = 0;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Transient
    private String imageUrl;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters
    public Long getId() { return id; }
    public Campaign getCampaign() { return campaign; }
    public String getMediaType() { return mediaType; }
    public String getUrl() { return url; }
    public String getBase64Data() { return base64Data; }
    public String getS3Key() { return s3Key; }
    public Boolean getIsPrimary() { return isPrimary; }
    public Integer getDisplayOrder() { return displayOrder; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getImageUrl() { return imageUrl; }

    // Setters
    public void setCampaign(Campaign campaign) { this.campaign = campaign; }
    public void setMediaType(String mediaType) { this.mediaType = mediaType; }
    public void setUrl(String url) { this.url = url; }
    public void setBase64Data(String base64Data) { this.base64Data = base64Data; }
    public void setS3Key(String s3Key) { this.s3Key = s3Key; }
    public void setIsPrimary(Boolean isPrimary) { this.isPrimary = isPrimary; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}
