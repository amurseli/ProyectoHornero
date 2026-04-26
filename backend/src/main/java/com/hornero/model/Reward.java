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

    public void setCampaign(Campaign campaign) { this.campaign = campaign; }
    public void setTitle(String title) { this.title = title; }
    public void setDescription(String description) { this.description = description; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }
}