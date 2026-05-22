package com.hornero.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "reward")
public class Reward {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_campaign", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "media", "creators", "rewards", "faqs"})
    private Campaign campaign;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal price;

    @Column(name = "display_order")
    private Integer displayOrder = 0;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "image_base64", columnDefinition = "TEXT")
    private String imageBase64;

    @Column(name = "image_s3_key", length = 500)
    private String imageS3Key;

    @Transient
    private String imageUrl;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Campaign getCampaign() { return campaign; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public BigDecimal getPrice() { return price; }
    public Integer getDisplayOrder() { return displayOrder; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getImageBase64() { return imageBase64; }
    public String getImageS3Key() { return imageS3Key; }
    public String getImageUrl() { return imageUrl; }

    public void setCampaign(Campaign campaign) { this.campaign = campaign; }
    public void setTitle(String title) { this.title = title; }
    public void setDescription(String description) { this.description = description; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }
    public void setImageBase64(String imageBase64) { this.imageBase64 = imageBase64; }
    public void setImageS3Key(String imageS3Key) { this.imageS3Key = imageS3Key; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

}
