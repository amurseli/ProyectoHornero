package com.hornero.repository;

import com.hornero.model.Reward;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RewardRepository extends JpaRepository<Reward, Long> {
    List<Reward> findByCampaignIdOrderByDisplayOrderAsc(Long campaignId);
    void deleteByCampaignId(Long campaignId);
}