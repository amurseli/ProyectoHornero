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
            'CONTRIBUTION' AS historyType,
            c.id AS contributionId,
            c.id_campaign AS campaignId,
            cam.title AS campaignTitle,
            t.amount AS amount,
            c.status AS entryStatus,
            t.id AS transactionId,
            t.transaction_method AS transactionMethod,
            t.payment_provider AS paymentProvider,
            CONCAT('USER_', c.id_user) AS senderLabel,
            'HORNERO_MAIN_ACCOUNT' AS recipientLabel,
            CONCAT('campaign:', cam.title) AS reference,
            t.hash_tx AS hashTx,
            t.created_at AS createdAt
        FROM payments.transaction t
        JOIN payments.contribution c ON c.id = t.id_contribution
        JOIN campaign cam ON cam.id = c.id_campaign
        WHERE c.status = 'APPROVED'
        UNION ALL
        SELECT
            'PAYOUT' AS historyType,
            NULL AS contributionId,
            p.id_campaign AS campaignId,
            cam.title AS campaignTitle,
            p.net_amount AS amount,
            p.status AS entryStatus,
            p.id AS transactionId,
            'MANUAL_TRANSFER' AS transactionMethod,
            p.payment_provider AS paymentProvider,
            'HORNERO_MAIN_ACCOUNT' AS senderLabel,
            CONCAT('CREATOR_', p.id_creator_user) AS recipientLabel,
            CONCAT('campaign:', cam.title) AS reference,
            p.hash_tx AS hashTx,
            COALESCE(p.processed_at, p.created_at) AS createdAt
        FROM payments.payout p
        JOIN campaign cam ON cam.id = p.id_campaign
        WHERE p.status = 'COMPLETED'
        UNION ALL
        SELECT
            'REFUND' AS historyType,
            r.id_contribution AS contributionId,
            c.id_campaign AS campaignId,
            cam.title AS campaignTitle,
            r.amount AS amount,
            r.status AS entryStatus,
            r.id AS transactionId,
            'REFUND' AS transactionMethod,
            r.payment_provider AS paymentProvider,
            'HORNERO_MAIN_ACCOUNT' AS senderLabel,
            CONCAT('USER_', c.id_user) AS recipientLabel,
            CONCAT('refund campaign:', cam.title) AS reference,
            r.hash_tx AS hashTx,
            COALESCE(r.processed_at, r.created_at) AS createdAt
        FROM payments.refund r
        JOIN payments.contribution c ON c.id = r.id_contribution
        JOIN campaign cam ON cam.id = c.id_campaign
        WHERE r.status = 'COMPLETED'
        ORDER BY createdAt DESC
        """, nativeQuery = true)
    List<TransactionHistoryProjection> findTransactionHistory();
}
