package com.hornero.repository;

import com.hornero.model.payments.PaymentContribution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface PaymentContributionRepository extends JpaRepository<PaymentContribution, Long> {

    @Query("SELECT c FROM PaymentContribution c LEFT JOIN FETCH c.transaction WHERE c.idCampaign = :campaignId ORDER BY c.createdAt DESC")
    List<PaymentContribution> findDetailedByCampaignId(@Param("campaignId") Long campaignId);

    long countByIdCampaignAndStatus(Long campaignId, String status);

    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM PaymentContribution c WHERE c.idCampaign = :campaignId AND c.status = :status")
    BigDecimal sumAmountByCampaignAndStatus(@Param("campaignId") Long campaignId, @Param("status") String status);
}
