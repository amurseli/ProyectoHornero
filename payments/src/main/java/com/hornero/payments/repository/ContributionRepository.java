package com.hornero.payments.repository;

import com.hornero.payments.model.Contribution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ContributionRepository extends JpaRepository<Contribution, Long> {

    List<Contribution> findByIdCampaignAndStatus(Long idCampaign, String status);

    List<Contribution> findByIdUserAndIdCampaign(Long idUser, Long idCampaign);

    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM Contribution c WHERE c.idUser = :userId AND c.idCampaign = :campaignId AND c.status = 'APPROVED'")
    BigDecimal sumApprovedAmountByUserAndCampaign(Long userId, Long campaignId);
}
