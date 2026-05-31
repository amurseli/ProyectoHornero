package com.hornero.repository;

import com.hornero.model.CampaignComment;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CampaignCommentRepository extends JpaRepository<CampaignComment, Long> {

    @EntityGraph(attributePaths = {"author", "parentComment"})
    List<CampaignComment> findByCampaignIdOrderByCreatedAtAsc(Long campaignId);

    @EntityGraph(attributePaths = {"author", "parentComment"})
    Optional<CampaignComment> findByIdAndCampaignId(Long id, Long campaignId);
}
