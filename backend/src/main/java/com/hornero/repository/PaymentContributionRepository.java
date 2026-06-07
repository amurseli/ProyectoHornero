package com.hornero.repository;

import com.hornero.model.payments.PaymentContribution;
import com.hornero.model.payments.PaymentTransaction;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

// The payments.contribution / payments.transaction tables are owned by the
// payments microservice; hornero reads them via native SQL so it can boot
// independently of that schema's lifecycle.
@Repository
public class PaymentContributionRepository {

    @PersistenceContext
    private EntityManager em;

    @SuppressWarnings("unchecked")
    public List<PaymentContribution> findDetailedByCampaignId(Long campaignId) {
        String sql = """
                SELECT
                    c.id, c.id_user, c.id_campaign, c.amount, c.reward_id, c.reward_price,
                    c.status, c.created_at, c.updated_at,
                    t.id, t.amount, t.transaction_method, t."CBU_origin", t."CBU_destination",
                    t.id_transaction_external, t.payment_provider, t.hash_tx, t.created_at
                FROM payments.contribution c
                LEFT JOIN payments.transaction t ON t.id_contribution = c.id
                WHERE c.id_campaign = :campaignId
                ORDER BY c.created_at DESC
                """;

        List<Object[]> rows = em.createNativeQuery(sql)
                .setParameter("campaignId", campaignId)
                .getResultList();

        List<PaymentContribution> result = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            PaymentContribution c = new PaymentContribution();
            c.setId(toLong(row[0]));
            c.setIdUser(toLong(row[1]));
            c.setIdCampaign(toLong(row[2]));
            c.setAmount(toBigDecimal(row[3]));
            c.setRewardId(toLong(row[4]));
            c.setRewardPrice(toBigDecimal(row[5]));
            c.setStatus((String) row[6]);
            c.setCreatedAt(toLocalDateTime(row[7]));
            c.setUpdatedAt(toLocalDateTime(row[8]));

            if (row[9] != null) {
                PaymentTransaction t = new PaymentTransaction();
                t.setId(toLong(row[9]));
                t.setAmount(toBigDecimal(row[10]));
                t.setTransactionMethod((String) row[11]);
                t.setCbuOrigin((String) row[12]);
                t.setCbuDestination((String) row[13]);
                t.setIdTransactionExternal((String) row[14]);
                t.setPaymentProvider((String) row[15]);
                t.setHashTx((String) row[16]);
                t.setCreatedAt(toLocalDateTime(row[17]));
                c.setTransaction(t);
            }

            result.add(c);
        }
        return result;
    }

    public long countByIdCampaignAndStatus(Long campaignId, String status) {
        Object result = em.createNativeQuery(
                        "SELECT COUNT(*) FROM payments.contribution WHERE id_campaign = :cid AND status = :status")
                .setParameter("cid", campaignId)
                .setParameter("status", status)
                .getSingleResult();
        return result == null ? 0L : ((Number) result).longValue();
    }

    public BigDecimal sumAmountByCampaignAndStatus(Long campaignId, String status) {
        Object result = em.createNativeQuery(
                        "SELECT COALESCE(SUM(amount), 0) FROM payments.contribution WHERE id_campaign = :cid AND status = :status")
                .setParameter("cid", campaignId)
                .setParameter("status", status)
                .getSingleResult();
        return toBigDecimal(result);
    }

    @SuppressWarnings("unchecked")
    public List<TransactionHistoryProjection> findTransactionHistory() {
        String sql = """
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
                    u.user_name AS senderLabel,
                    'HORNERO_MAIN_ACCOUNT' AS recipientLabel,
                    CONCAT('campaign:', cam.title) AS reference,
                    t.hash_tx AS hashTx,
                    t.created_at AS createdAt,
                    t.id_transaction_external AS operationNumber
                FROM payments.transaction t
                JOIN payments.contribution c ON c.id = t.id_contribution
                JOIN "user" u ON u.id = c.id_user
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
                    CONCAT('CREATOR_', cu.user_name) AS recipientLabel,
                    CONCAT('campaign:', cam.title) AS reference,
                    p.hash_tx AS hashTx,
                    COALESCE(p.processed_at, p.created_at) AS createdAt,
                    p.id_payout_external AS operationNumber
                FROM payments.payout p
                JOIN "user" cu ON cu.id = p.id_creator_user
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
                    u2.user_name AS recipientLabel,
                    CONCAT('refund campaign:', cam.title) AS reference,
                    r.hash_tx AS hashTx,
                    COALESCE(r.processed_at, r.created_at) AS createdAt,
                    r.id_refund_external AS operationNumber
                FROM payments.refund r
                JOIN payments.contribution c ON c.id = r.id_contribution
                JOIN "user" u2 ON u2.id = c.id_user
                JOIN campaign cam ON cam.id = c.id_campaign
                WHERE r.status = 'COMPLETED'
                ORDER BY createdAt DESC
                """;

        List<Object[]> rows = em.createNativeQuery(sql).getResultList();
        List<TransactionHistoryProjection> result = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            result.add(new TransactionHistoryRow(
                    (String) row[0],
                    toLong(row[1]),
                    toLong(row[2]),
                    (String) row[3],
                    toBigDecimal(row[4]),
                    (String) row[5],
                    toLong(row[6]),
                    (String) row[7],
                    (String) row[8],
                    (String) row[9],
                    (String) row[10],
                    (String) row[11],
                    (String) row[12],
                    toLocalDateTime(row[13]),
                    (String) row[14]
            ));
        }
        return result;
    }

    private static Long toLong(Object value) {
        return value == null ? null : ((Number) value).longValue();
    }

    private static BigDecimal toBigDecimal(Object value) {
        if (value == null) return null;
        if (value instanceof BigDecimal bd) return bd;
        return new BigDecimal(value.toString());
    }

    private static LocalDateTime toLocalDateTime(Object value) {
        if (value == null) return null;
        if (value instanceof Timestamp ts) return ts.toLocalDateTime();
        if (value instanceof LocalDateTime ldt) return ldt;
        return null;
    }

    // Static implementation of the TransactionHistoryProjection interface so the
    // controller layer continues to consume it the same way.
    private record TransactionHistoryRow(
            String historyType,
            Long contributionId,
            Long campaignId,
            String campaignTitle,
            BigDecimal amount,
            String entryStatus,
            Long transactionId,
            String transactionMethod,
            String paymentProvider,
            String senderLabel,
            String recipientLabel,
            String reference,
            String hashTx,
            LocalDateTime createdAt,
            String operationNumber
    ) implements TransactionHistoryProjection {
        @Override public String getHistoryType() { return historyType; }
        @Override public Long getContributionId() { return contributionId; }
        @Override public Long getCampaignId() { return campaignId; }
        @Override public String getCampaignTitle() { return campaignTitle; }
        @Override public BigDecimal getAmount() { return amount; }
        @Override public String getEntryStatus() { return entryStatus; }
        @Override public Long getTransactionId() { return transactionId; }
        @Override public String getTransactionMethod() { return transactionMethod; }
        @Override public String getPaymentProvider() { return paymentProvider; }
        @Override public String getSenderLabel() { return senderLabel; }
        @Override public String getRecipientLabel() { return recipientLabel; }
        @Override public String getReference() { return reference; }
        @Override public String getHashTx() { return hashTx; }
        @Override public LocalDateTime getCreatedAt() { return createdAt; }
        @Override public String getOperationNumber() { return operationNumber; }
    }
}
