package com.hornero.payments.repository;

import com.hornero.payments.model.Refund;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RefundRepository extends JpaRepository<Refund, Long> {

    List<Refund> findByContribution_IdCampaign(Long idCampaign);

    Optional<Refund> findFirstByContribution_Id(Long contributionId);

    List<Refund> findByContribution_IdCampaignAndStatus(Long campaignId, String status);
}
