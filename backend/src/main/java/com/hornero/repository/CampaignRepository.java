package com.hornero.repository;

import com.hornero.model.Campaign;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
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
           "LEFT JOIN FETCH c.owner " +
           "LEFT JOIN FETCH c.category " +
           "WHERE c.status <> 'DRAFT'")
    List<Campaign> findAllAdminWithOwner();

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

    @Query("SELECT c FROM Campaign c " +
           "LEFT JOIN FETCH c.media " +
           "LEFT JOIN FETCH c.category " +
           "LEFT JOIN FETCH c.owner o " +
           "WHERE LOWER(o.userName) = LOWER(:username)")
    List<Campaign> findByOwnerUsernameWithRelations(@Param("username") String username);

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

    @Query(value = "SELECT c.id FROM Campaign c " +
                   "WHERE c.status IN :statuses " +
                   "AND (:search = '' OR LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%'))) " +
                   "AND (:categoryId IS NULL OR c.category.id = :categoryId) " +
                   "ORDER BY c.createdAt DESC",
           countQuery = "SELECT COUNT(c) FROM Campaign c " +
                        "WHERE c.status IN :statuses " +
                        "AND (:search = '' OR LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%'))) " +
                        "AND (:categoryId IS NULL OR c.category.id = :categoryId)")
    Page<Long> findBrowseIdsPagedByRecent(@Param("search") String search,
                                          @Param("categoryId") Long categoryId,
                                          @Param("statuses") List<String> statuses,
                                          Pageable pageable);

    @Query(value = "SELECT c.id FROM Campaign c " +
                   "WHERE c.status IN :statuses " +
                   "AND (:search = '' OR LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%'))) " +
                   "AND (:categoryId IS NULL OR c.category.id = :categoryId) " +
                   "ORDER BY c.currentAmount DESC",
           countQuery = "SELECT COUNT(c) FROM Campaign c " +
                        "WHERE c.status IN :statuses " +
                        "AND (:search = '' OR LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%'))) " +
                        "AND (:categoryId IS NULL OR c.category.id = :categoryId)")
    Page<Long> findBrowseIdsPagedByFunded(@Param("search") String search,
                                          @Param("categoryId") Long categoryId,
                                          @Param("statuses") List<String> statuses,
                                          Pageable pageable);

    @Query(value = "SELECT c.id FROM Campaign c " +
                   "WHERE c.status IN :statuses " +
                   "AND c.endDate IS NOT NULL " +
                   "AND (:search = '' OR LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%'))) " +
                   "AND (:categoryId IS NULL OR c.category.id = :categoryId) " +
                   "ORDER BY c.endDate ASC",
           countQuery = "SELECT COUNT(c) FROM Campaign c " +
                        "WHERE c.status IN :statuses " +
                        "AND c.endDate IS NOT NULL " +
                        "AND (:search = '' OR LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%'))) " +
                        "AND (:categoryId IS NULL OR c.category.id = :categoryId)")
    Page<Long> findBrowseIdsPagedByEnding(@Param("search") String search,
                                          @Param("categoryId") Long categoryId,
                                          @Param("statuses") List<String> statuses,
                                          Pageable pageable);

    @Query("SELECT DISTINCT c FROM Campaign c " +
           "LEFT JOIN FETCH c.media " +
           "LEFT JOIN FETCH c.category " +
           "LEFT JOIN FETCH c.owner " +
           "WHERE c.id IN :ids")
    List<Campaign> findAllByIdsWithRelations(@Param("ids") List<Long> ids);

    @Query("SELECT c FROM Campaign c LEFT JOIN FETCH c.owner WHERE c.status = 'CROWDFUNDING' AND c.endDate < :today")
    List<Campaign> findExpiredCrowdfundingCampaigns(@Param("today") LocalDate today);

    @Query("SELECT c FROM Campaign c LEFT JOIN FETCH c.owner WHERE c.status = 'SUCCESSFUL' AND c.moneyStatus = 'PAYOUT_PENDING'")
    List<Campaign> findSuccessfulWithPendingPayout();

    @Query("SELECT c FROM Campaign c LEFT JOIN FETCH c.owner WHERE c.status = 'FAILED' AND c.moneyStatus = 'REFUND_PARTIAL'")
    List<Campaign> findFailedWithPartialRefund();

    @Query("SELECT c.id FROM Campaign c " +
           "WHERE c.status = 'CROWDFUNDING' " +
           "AND c.targetAmount IS NOT NULL AND c.targetAmount > 0 " +
           "AND c.currentAmount IS NOT NULL " +
           "ORDER BY (c.currentAmount / c.targetAmount) DESC")
    List<Long> findFeaturedIds(Pageable pageable);

    @Query("SELECT c.id FROM Campaign c " +
           "WHERE c.status = 'CROWDFUNDING' " +
           "AND c.endDate IS NOT NULL " +
           "AND c.endDate > :today AND c.endDate <= :cutoff " +
           "AND (c.targetAmount IS NULL OR c.targetAmount = 0 " +
           "     OR c.currentAmount IS NULL OR c.currentAmount < c.targetAmount) " +
           "ORDER BY c.endDate ASC")
    List<Long> findEndingSoonIds(@Param("today") LocalDate today,
                                 @Param("cutoff") LocalDate cutoff,
                                 Pageable pageable);

    @Query("SELECT c.id FROM Campaign c " +
           "WHERE c.status = 'CROWDFUNDING' " +
           "AND c.targetAmount IS NOT NULL AND c.targetAmount > 0 " +
           "AND c.currentAmount IS NOT NULL " +
           "AND (c.currentAmount / c.targetAmount) >= 0.70 " +
           "AND (c.currentAmount / c.targetAmount) < 1.0 " +
           "ORDER BY (c.currentAmount / c.targetAmount) DESC")
    List<Long> findNearGoalIds(Pageable pageable);

    @Query("SELECT c.id FROM Campaign c " +
           "WHERE c.status = 'CROWDFUNDING' " +
           "ORDER BY c.createdAt DESC")
    List<Long> findRecentIds(Pageable pageable);

    @Query("SELECT c.id FROM Campaign c " +
           "WHERE c.status = 'CROWDFUNDING' " +
           "AND c.isSpotlight = true " +
           "ORDER BY c.updatedAt DESC")
    List<Long> findSpotlightIds(Pageable pageable);

    @Query("SELECT c.id FROM Campaign c " +
           "WHERE c.status = 'CROWDFUNDING' " +
           "AND c.category.id = :categoryId " +
           "AND c.targetAmount IS NOT NULL AND c.targetAmount > 0 " +
           "AND c.currentAmount IS NOT NULL " +
           "ORDER BY (c.currentAmount / c.targetAmount) DESC")
    List<Long> findTopByCategoryIds(@Param("categoryId") Long categoryId, Pageable pageable);

    @Query("SELECT COUNT(c) FROM Campaign c " +
           "WHERE c.status = 'CROWDFUNDING' " +
           "AND c.category.id = :categoryId")
    long countActiveByCategoryId(@Param("categoryId") Long categoryId);

    List<Campaign> findByIsTest(boolean isTest);
}