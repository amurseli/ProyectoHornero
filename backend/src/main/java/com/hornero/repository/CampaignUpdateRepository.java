package com.hornero.repository;

import com.hornero.model.CampaignUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CampaignUpdateRepository extends JpaRepository<CampaignUpdate, Long> {

    List<CampaignUpdate> findByCampaignIdOrderByCreatedAtDesc(Long campaignId);

    Optional<CampaignUpdate> findByIdAndCampaignId(Long id, Long campaignId);
}
