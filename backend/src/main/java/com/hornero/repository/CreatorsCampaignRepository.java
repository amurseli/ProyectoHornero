package com.hornero.repository;

import com.hornero.model.CreatorsCampaign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CreatorsCampaignRepository extends JpaRepository<CreatorsCampaign, Long> {
    List<CreatorsCampaign> findByCampaignId(Long campaignId);
    List<CreatorsCampaign> findByUserId(Long userId);
    Optional<CreatorsCampaign> findByCampaignIdAndUserId(Long campaignId, Long userId);
}