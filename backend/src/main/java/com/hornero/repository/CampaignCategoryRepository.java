package com.hornero.repository;

import com.hornero.model.CampaignCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CampaignCategoryRepository extends JpaRepository<CampaignCategory, Long> {
    Optional<CampaignCategory> findByName(String name);
}