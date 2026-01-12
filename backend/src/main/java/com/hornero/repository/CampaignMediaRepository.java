package com.hornero.repository;

import com.hornero.model.CampaignMedia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CampaignMediaRepository extends JpaRepository<CampaignMedia, Long> {
    List<CampaignMedia> findByCampaignIdOrderByDisplayOrder(Long campaignId);
    List<CampaignMedia> findByCampaignIdAndIsPrimaryTrue(Long campaignId);
}