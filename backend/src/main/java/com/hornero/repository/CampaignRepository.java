package com.hornero.repository;

import com.hornero.model.Campaign;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    @Query("SELECT DISTINCT c FROM Campaign c " +
           "LEFT JOIN FETCH c.media " +
           "LEFT JOIN FETCH c.category " +
           "LEFT JOIN FETCH c.owner " +
           "WHERE c.status = 'CROWDFUNDING'")
    List<Campaign> findAllPublicWithRelations();

    @Query("SELECT DISTINCT c FROM Campaign c " +
           "LEFT JOIN FETCH c.media " +
           "LEFT JOIN FETCH c.category " +
           "LEFT JOIN FETCH c.owner " +
           "WHERE c.owner.id = :ownerId")
    List<Campaign> findAllByOwnerIdWithRelations(@Param("ownerId") Long ownerId);

    @Query("SELECT c FROM Campaign c " +
           "LEFT JOIN FETCH c.media " +
           "LEFT JOIN FETCH c.category " +
           "LEFT JOIN FETCH c.owner " +
           "WHERE c.id = :id")
    Optional<Campaign> findByIdWithRelations(Long id);

    // Paginar por IDs primero evita el problema de paginación en memoria
    // cuando se usa JOIN FETCH sobre colecciones (c.media)
    @Query(value = "SELECT c.id FROM Campaign c " +
                   "WHERE c.status = 'CROWDFUNDING' " +
                   "AND (:search IS NULL OR LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%'))) " +
                   "AND (:categoryId IS NULL OR c.category.id = :categoryId)",
           countQuery = "SELECT COUNT(c) FROM Campaign c " +
                        "WHERE c.status = 'CROWDFUNDING' " +
                        "AND (:search IS NULL OR LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%'))) " +
                        "AND (:categoryId IS NULL OR c.category.id = :categoryId)")
    Page<Long> findPublicIdsPaged(@Param("search") String search,
                                  @Param("categoryId") Long categoryId,
                                  Pageable pageable);

    @Query("SELECT DISTINCT c FROM Campaign c " +
           "LEFT JOIN FETCH c.media " +
           "LEFT JOIN FETCH c.category " +
           "LEFT JOIN FETCH c.owner " +
           "WHERE c.id IN :ids")
    List<Campaign> findAllByIdsWithRelations(@Param("ids") List<Long> ids);
}