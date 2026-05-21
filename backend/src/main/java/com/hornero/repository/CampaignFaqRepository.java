package com.hornero.repository;

import com.hornero.model.CampaignFaq;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CampaignFaqRepository extends JpaRepository<CampaignFaq, Long> {
    List<CampaignFaq> findByCampaignIdOrderByDisplayOrderAsc(Long campaignId);
    void deleteByCampaignId(Long campaignId);
}