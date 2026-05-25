package com.hornero.model.payments;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "contribution", schema = "payments")
public class PaymentContribution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_user", nullable = false)
    private Long idUser;

    @Column(name = "id_campaign", nullable = false)
    private Long idCampaign;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "reward_id")
    private Long rewardId;

    @Column(name = "reward_price", precision = 15, scale = 2)
    private BigDecimal rewardPrice;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToOne(mappedBy = "contribution", fetch = FetchType.LAZY)
    private PaymentTransaction transaction;

    public Long getId() { return id; }
    public Long getIdUser() { return idUser; }
    public Long getIdCampaign() { return idCampaign; }
    public BigDecimal getAmount() { return amount; }
    public Long getRewardId() { return rewardId; }
    public BigDecimal getRewardPrice() { return rewardPrice; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public PaymentTransaction getTransaction() { return transaction; }
}
