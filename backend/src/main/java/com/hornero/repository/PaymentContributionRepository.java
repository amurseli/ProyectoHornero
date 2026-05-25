package com.hornero.repository;

import com.hornero.model.payments.PaymentContribution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface PaymentContributionRepository extends JpaRepository<PaymentContribution, Long> {

    @Query("SELECT c FROM PaymentContribution c LEFT JOIN FETCH c.transaction WHERE c.idCampaign = :campaignId ORDER BY c.createdAt DESC")
    List<PaymentContribution> findDetailedByCampaignId(@Param("campaignId") Long campaignId);

    long countByIdCampaignAndStatus(Long campaignId, String status);

    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM PaymentContribution c WHERE c.idCampaign = :campaignId AND c.status = :status")
    BigDecimal sumAmountByCampaignAndStatus(@Param("campaignId") Long campaignId, @Param("status") String status);

    @Query(value = """
        SELECT
            c.id AS contributionId,
            c.id_campaign AS campaignId,
            cam.title AS campaignTitle,
            t.amount AS amount,
            c.status AS contributionStatus,
            t.id AS transactionId,
            t.transaction_method AS transactionMethod,
            t.payment_provider AS paymentProvider,
            t.id_transaction_external AS externalTransactionId,
            t.hash_tx AS hashTx,
            t.created_at AS createdAt
        FROM payments.transaction t
        JOIN payments.contribution c ON c.id = t.id_contribution
        JOIN campaign cam ON cam.id = c.id_campaign
        ORDER BY t.created_at DESC
        """, nativeQuery = true)
    List<TransactionHistoryProjection> findTransactionHistory();
}
