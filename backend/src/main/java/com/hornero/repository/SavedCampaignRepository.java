package com.hornero.repository;

import com.hornero.model.SavedCampaign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedCampaignRepository extends JpaRepository<SavedCampaign, Long> {

    boolean existsByUserIdAndCampaignId(Long userId, Long campaignId);

    Optional<SavedCampaign> findByUserIdAndCampaignId(Long userId, Long campaignId);

    void deleteByUserIdAndCampaignId(Long userId, Long campaignId);

    @Query("SELECT DISTINCT sc FROM SavedCampaign sc " +
           "JOIN FETCH sc.campaign c " +
           "LEFT JOIN FETCH c.media " +
           "LEFT JOIN FETCH c.category " +
           "LEFT JOIN FETCH c.owner " +
           "WHERE sc.user.id = :userId " +
           "ORDER BY sc.createdAt DESC")
    List<SavedCampaign> findAllByUserIdWithCampaignRelations(@Param("userId") Long userId);
}
