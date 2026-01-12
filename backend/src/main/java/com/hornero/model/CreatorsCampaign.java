package com.hornero.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "creators_campaign", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"id_campaign", "id_user"})
})
public class CreatorsCampaign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_campaign", nullable = false)
    private Campaign campaign;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_user", nullable = false)
    private User user;

    @Column(nullable = false, length = 20)
    private String role = "OWNER";

    @Column(name = "added_at", updatable = false)
    private LocalDateTime addedAt;

    @PrePersist
    protected void onCreate() {
        addedAt = LocalDateTime.now();
    }

    // Getters
    public Long getId() { return id; }
    public Campaign getCampaign() { return campaign; }
    public User getUser() { return user; }
    public String getRole() { return role; }
    public LocalDateTime getAddedAt() { return addedAt; }

    // Setters
    public void setCampaign(Campaign campaign) { this.campaign = campaign; }
    public void setUser(User user) { this.user = user; }
    public void setRole(String role) { this.role = role; }
}