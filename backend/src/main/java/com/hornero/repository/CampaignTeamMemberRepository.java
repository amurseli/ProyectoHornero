package com.hornero.repository;

import com.hornero.model.CampaignTeamMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CampaignTeamMemberRepository extends JpaRepository<CampaignTeamMember, Long> {
    List<CampaignTeamMember> findByCampaignIdOrderByDisplayOrderAsc(Long campaignId);
    void deleteByCampaignId(Long campaignId);
}
