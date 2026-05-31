package com.hornero.payments.repository;

import com.hornero.payments.dto.AdminCampaignPaymentSummaryResponse;
import com.hornero.payments.model.Contribution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ContributionRepository extends JpaRepository<Contribution, Long> {

    List<Contribution> findByIdCampaignAndStatus(Long idCampaign, String status);

    List<Contribution> findByStatusAndCreatedAtBefore(String status, LocalDateTime before);

    List<Contribution> findByIdUserAndIdCampaign(Long idUser, Long idCampaign);

    @Query("SELECT c FROM Contribution c LEFT JOIN FETCH c.transaction WHERE c.idCampaign = :campaignId ORDER BY c.createdAt DESC")
    List<Contribution> findDetailedByIdCampaign(@Param("campaignId") Long campaignId);

    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM Contribution c WHERE c.idUser = :userId AND c.idCampaign = :campaignId AND c.status = 'APPROVED'")
    BigDecimal sumApprovedAmountByUserAndCampaign(Long userId, Long campaignId);

    @Query("""
        SELECT new com.hornero.payments.dto.AdminCampaignPaymentSummaryResponse(
            c.idCampaign,
            COUNT(c),
            COALESCE(SUM(c.amount), 0)
        )
        FROM Contribution c
        WHERE c.status = 'APPROVED' AND c.idCampaign IN :campaignIds
        GROUP BY c.idCampaign
        """)
    List<AdminCampaignPaymentSummaryResponse> summarizeApprovedByCampaignIds(@Param("campaignIds") List<Long> campaignIds);
}
