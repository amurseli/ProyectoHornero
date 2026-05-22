package com.hornero.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "campaign_team_member")
public class CampaignTeamMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_campaign", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "media", "creators", "rewards", "faqs"})
    private Campaign campaign;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 200)
    private String role;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "image_base64", columnDefinition = "TEXT")
    private String imageBase64;

    @Column(name = "image_s3_key", length = 500)
    private String imageS3Key;

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

    public Long getId() { return id; }
    public Campaign getCampaign() { return campaign; }
    public String getName() { return name; }
    public String getRole() { return role; }
    public String getBio() { return bio; }
    public String getImageBase64() { return imageBase64; }
    public String getImageS3Key() { return imageS3Key; }
    public Integer getDisplayOrder() { return displayOrder; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getImageUrl() { return imageUrl; }

    public void setCampaign(Campaign campaign) { this.campaign = campaign; }
    public void setName(String name) { this.name = name; }
    public void setRole(String role) { this.role = role; }
    public void setBio(String bio) { this.bio = bio; }
    public void setImageBase64(String imageBase64) { this.imageBase64 = imageBase64; }
    public void setImageS3Key(String imageS3Key) { this.imageS3Key = imageS3Key; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}
