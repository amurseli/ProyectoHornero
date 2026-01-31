package com.hornero.repository;

import com.hornero.model.Campaign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CampaignRepository extends JpaRepository<Campaign, Long> {
    
    @Query("SELECT DISTINCT c FROM Campaign c " +
           "LEFT JOIN FETCH c.media " +
           "LEFT JOIN FETCH c.category " +
           "LEFT JOIN FETCH c.owner")
    List<Campaign> findAllWithRelations();
    
    @Query("SELECT c FROM Campaign c " +
           "LEFT JOIN FETCH c.media " +
           "LEFT JOIN FETCH c.category " +
           "LEFT JOIN FETCH c.owner " +
           "WHERE c.id = :id")
    Optional<Campaign> findByIdWithRelations(Long id);
}