package com.hornero.client;

import com.hornero.dto.AdminCampaignPayoutResponse;
import com.hornero.dto.AdminCampaignContributionResponse;
import com.hornero.dto.AdminCampaignDetailResponse;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpStatusCodeException;

import java.util.Map;
import java.util.List;
import java.util.ArrayList;
import java.util.HashMap;

// Cliente HTTP para comunicacion interna con el payments service.
// Usa X-Service-Key para autenticacion entre servicios.
@Component
public class PaymentsServiceClient {

    private static final Logger logger = LoggerFactory.getLogger(PaymentsServiceClient.class);

    private final RestTemplate restTemplate;

    @Value("${payments.service.url}")
    private String paymentsUrl;

    @Value("${app.service-key}")
    private String serviceKey;

    public PaymentsServiceClient() {
        HttpComponentsClientHttpRequestFactory factory =
                new HttpComponentsClientHttpRequestFactory(HttpClients.createDefault());
        this.restTemplate = new RestTemplate(factory);
    }

    public void triggerPayout(Long campaignId, Long creatorUserId) {
        String url = paymentsUrl + "/api/payments/campaigns/" + campaignId + "/payout";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Service-Key", serviceKey);
        Map<String, Long> body = Map.of("creatorUserId", creatorUserId);
        HttpEntity<Map<String, Long>> entity = new HttpEntity<>(body, headers);
        try {
            restTemplate.exchange(url, HttpMethod.POST, entity, Void.class);
            logger.info("Payout disparado para campaña {}", campaignId);
        } catch (Exception e) {
            logger.error("Error al disparar payout para campaña {}: {}", campaignId, e.getMessage());
            throw new RuntimeException("Error al disparar payout para campaña " + campaignId, e);
        }
    }

    public AdminCampaignPayoutResponse createOrGetPayout(Long campaignId, Long creatorUserId) {
        String url = paymentsUrl + "/api/payments/campaigns/" + campaignId + "/payout";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Service-Key", serviceKey);
        Map<String, Long> body = Map.of("creatorUserId", creatorUserId);
        HttpEntity<Map<String, Long>> entity = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<AdminCampaignPayoutResponse> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity, AdminCampaignPayoutResponse.class);
            return response.getBody();
        } catch (HttpStatusCodeException e) {
            String detail = extractErrorMessage(e.getResponseBodyAsString());
            logger.error("Error al crear/consultar payout para campaña {}: {}", campaignId, detail);
            throw new RuntimeException(detail);
        } catch (Exception e) {
            logger.error("Error al crear/consultar payout para campaña {}: {}", campaignId, e.getMessage());
            throw new RuntimeException("Error al preparar payout para campaña " + campaignId, e);
        }
    }

    public AdminCampaignPayoutResponse confirmPayout(Long campaignId, String transferReference) {
        String url = paymentsUrl + "/api/payments/campaigns/" + campaignId + "/payout/confirm";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Service-Key", serviceKey);
        Map<String, String> body = transferReference == null || transferReference.isBlank()
                ? Map.of()
                : Map.of("mpTransferReference", transferReference);
        HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<AdminCampaignPayoutResponse> response = restTemplate.exchange(
                    url, HttpMethod.PATCH, entity, AdminCampaignPayoutResponse.class);
            return response.getBody();
        } catch (HttpStatusCodeException e) {
            String detail = extractErrorMessage(e.getResponseBodyAsString());
            logger.error("Error al confirmar payout para campaña {}: {}", campaignId, detail);
            throw new RuntimeException(detail);
        } catch (Exception e) {
            logger.error("Error al confirmar payout para campaña {}: {}", campaignId, e.getMessage());
            throw new RuntimeException("Error al confirmar payout para campaña " + campaignId, e);
        }
    }

    public void triggerRefundAll(Long campaignId) {
        String url = paymentsUrl + "/api/payments/campaigns/" + campaignId + "/refund-all";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Service-Key", serviceKey);
        Map<String, String> body = Map.of("reason", "CAMPAIGN_FAILED");
        HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);
        try {
            restTemplate.exchange(url, HttpMethod.POST, entity, Void.class);
            logger.info("Refund-all disparado para campaña {}", campaignId);
        } catch (Exception e) {
            logger.error("Error al disparar refund-all para campaña {}: {}", campaignId, e.getMessage());
            throw new RuntimeException("Error al disparar refund-all para campaña " + campaignId, e);
        }
    }

    public int triggerCleanupStalePending() {
        String url = paymentsUrl + "/api/internal/payments/contributions/cleanup-stale";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Service-Key", serviceKey);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
            Map<?, ?> body = response.getBody();
            Object resolved = body != null ? body.get("resolved") : null;
            int count = resolved instanceof Number n ? n.intValue() : 0;
            logger.info("Cleanup de contribuciones abandonadas: {} resueltas", count);
            return count;
        } catch (Exception e) {
            logger.error("Error al ejecutar cleanup de contribuciones abandonadas: {}", e.getMessage());
            throw new RuntimeException("Error al ejecutar cleanup de contribuciones abandonadas", e);
        }
    }

    public void triggerRetryFailedRefunds(Long campaignId) {
        String url = paymentsUrl + "/api/payments/campaigns/" + campaignId + "/retry-failed-refunds";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Service-Key", serviceKey);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        try {
            restTemplate.exchange(url, HttpMethod.POST, entity, Void.class);
            logger.info("Retry de refunds fallidos disparado para campaña {}", campaignId);
        } catch (Exception e) {
            logger.error("Error al reintentar refunds fallidos para campaña {}: {}", campaignId, e.getMessage());
            throw new RuntimeException("Error al reintentar refunds fallidos para campaña " + campaignId, e);
        }
    }

    public Map<Long, PaymentCampaignSummary> fetchCampaignSummaries(List<Long> campaignIds) {
        if (campaignIds == null || campaignIds.isEmpty()) {
            return Map.of();
        }

        String url = paymentsUrl + "/api/internal/payments/campaigns/summary";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Service-Key", serviceKey);
        HttpEntity<Map<String, List<Long>>> entity = new HttpEntity<>(Map.of("campaignIds", campaignIds), headers);

        try {
            ResponseEntity<PaymentCampaignSummary[]> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity, PaymentCampaignSummary[].class);
            Map<Long, PaymentCampaignSummary> summaries = new HashMap<>();
            PaymentCampaignSummary[] body = response.getBody();
            if (body != null) {
                for (PaymentCampaignSummary summary : body) {
                    if (summary != null && summary.getCampaignId() != null) {
                        summaries.put(summary.getCampaignId(), summary);
                    }
                }
            }
            return summaries;
        } catch (Exception e) {
            logger.error("Error al obtener resúmenes de payments: {}", e.getMessage());
            throw new RuntimeException("Error al obtener resúmenes de payments", e);
        }
    }

    public AdminCampaignDetailResponse fetchCampaignDetail(Long campaignId) {
        String url = paymentsUrl + "/api/internal/payments/campaigns/" + campaignId + "/detail";
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Service-Key", serviceKey);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<PaymentCampaignDetail> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, PaymentCampaignDetail.class);
            PaymentCampaignDetail body = response.getBody();
            if (body == null) {
                throw new RuntimeException("Payments devolvió detalle vacío");
            }

            AdminCampaignDetailResponse detail = new AdminCampaignDetailResponse();
            detail.setApprovedAmount(body.getApprovedAmount());
            detail.setApprovedContributionCount(body.getApprovedContributionCount());
            detail.setContributions(mapContributionResponses(body.getContributions()));
            return detail;
        } catch (HttpStatusCodeException e) {
            String detail = extractErrorMessage(e.getResponseBodyAsString());
            logger.error("Error al obtener detalle financiero para campaña {}: {}", campaignId, detail);
            throw new RuntimeException(detail);
        } catch (Exception e) {
            logger.error("Error al obtener detalle financiero para campaña {}: {}", campaignId, e.getMessage());
            throw new RuntimeException("Error al obtener detalle financiero de payments", e);
        }
    }

    private List<AdminCampaignContributionResponse> mapContributionResponses(List<PaymentCampaignContribution> contributions) {
        if (contributions == null || contributions.isEmpty()) {
            return List.of();
        }

        List<AdminCampaignContributionResponse> items = new ArrayList<>();
        for (PaymentCampaignContribution source : contributions) {
            AdminCampaignContributionResponse item = new AdminCampaignContributionResponse();
            item.setContributionId(source.getContributionId());
            item.setContributorUserId(source.getContributorUserId());
            item.setAmount(source.getAmount());
            item.setRewardId(source.getRewardId());
            item.setRewardPrice(source.getRewardPrice());
            item.setStatus(source.getStatus());
            item.setCreatedAt(source.getCreatedAt());
            item.setUpdatedAt(source.getUpdatedAt());

            if (source.getTransaction() != null) {
                AdminCampaignContributionResponse.TransactionInfo tx = new AdminCampaignContributionResponse.TransactionInfo();
                tx.setTransactionId(source.getTransaction().getTransactionId());
                tx.setAmount(source.getTransaction().getAmount());
                tx.setTransactionMethod(source.getTransaction().getTransactionMethod());
                tx.setPaymentProvider(source.getTransaction().getPaymentProvider());
                tx.setExternalTransactionId(source.getTransaction().getExternalTransactionId());
                tx.setHashTx(source.getTransaction().getHashTx());
                tx.setCreatedAt(source.getTransaction().getCreatedAt());
                item.setTransaction(tx);
            }

            items.add(item);
        }
        return items;
    }

    private String extractErrorMessage(String body) {
        if (body == null || body.isBlank()) {
            return "Error al preparar payout";
        }

        String[] keys = { "\"message\":\"", "\"error\":\"" };
        for (String key : keys) {
            int start = body.indexOf(key);
            if (start >= 0) {
                int from = start + key.length();
                int end = body.indexOf('"', from);
                if (end > from) {
                    return body.substring(from, end);
                }
            }
        }

        return body;
    }

    public static class PaymentCampaignSummary {
        private Long campaignId;
        private long approvedContributionCount;
        private java.math.BigDecimal approvedAmount;

        public Long getCampaignId() { return campaignId; }
        public void setCampaignId(Long campaignId) { this.campaignId = campaignId; }
        public long getApprovedContributionCount() { return approvedContributionCount; }
        public void setApprovedContributionCount(long approvedContributionCount) { this.approvedContributionCount = approvedContributionCount; }
        public java.math.BigDecimal getApprovedAmount() { return approvedAmount; }
        public void setApprovedAmount(java.math.BigDecimal approvedAmount) { this.approvedAmount = approvedAmount; }
    }

    public static class PaymentCampaignDetail {
        private Long campaignId;
        private java.math.BigDecimal approvedAmount;
        private long approvedContributionCount;
        private List<PaymentCampaignContribution> contributions;

        public Long getCampaignId() { return campaignId; }
        public void setCampaignId(Long campaignId) { this.campaignId = campaignId; }
        public java.math.BigDecimal getApprovedAmount() { return approvedAmount; }
        public void setApprovedAmount(java.math.BigDecimal approvedAmount) { this.approvedAmount = approvedAmount; }
        public long getApprovedContributionCount() { return approvedContributionCount; }
        public void setApprovedContributionCount(long approvedContributionCount) { this.approvedContributionCount = approvedContributionCount; }
        public List<PaymentCampaignContribution> getContributions() { return contributions; }
        public void setContributions(List<PaymentCampaignContribution> contributions) { this.contributions = contributions; }
    }

    public static class PaymentCampaignContribution {
        private Long contributionId;
        private Long contributorUserId;
        private java.math.BigDecimal amount;
        private Long rewardId;
        private java.math.BigDecimal rewardPrice;
        private String status;
        private java.time.LocalDateTime createdAt;
        private java.time.LocalDateTime updatedAt;
        private PaymentTransaction transaction;

        public Long getContributionId() { return contributionId; }
        public void setContributionId(Long contributionId) { this.contributionId = contributionId; }
        public Long getContributorUserId() { return contributorUserId; }
        public void setContributorUserId(Long contributorUserId) { this.contributorUserId = contributorUserId; }
        public java.math.BigDecimal getAmount() { return amount; }
        public void setAmount(java.math.BigDecimal amount) { this.amount = amount; }
        public Long getRewardId() { return rewardId; }
        public void setRewardId(Long rewardId) { this.rewardId = rewardId; }
        public java.math.BigDecimal getRewardPrice() { return rewardPrice; }
        public void setRewardPrice(java.math.BigDecimal rewardPrice) { this.rewardPrice = rewardPrice; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public java.time.LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(java.time.LocalDateTime createdAt) { this.createdAt = createdAt; }
        public java.time.LocalDateTime getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(java.time.LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
        public PaymentTransaction getTransaction() { return transaction; }
        public void setTransaction(PaymentTransaction transaction) { this.transaction = transaction; }
    }

    public static class PaymentTransaction {
        private Long transactionId;
        private java.math.BigDecimal amount;
        private String transactionMethod;
        private String paymentProvider;
        private String externalTransactionId;
        private String hashTx;
        private java.time.LocalDateTime createdAt;

        public Long getTransactionId() { return transactionId; }
        public void setTransactionId(Long transactionId) { this.transactionId = transactionId; }
        public java.math.BigDecimal getAmount() { return amount; }
        public void setAmount(java.math.BigDecimal amount) { this.amount = amount; }
        public String getTransactionMethod() { return transactionMethod; }
        public void setTransactionMethod(String transactionMethod) { this.transactionMethod = transactionMethod; }
        public String getPaymentProvider() { return paymentProvider; }
        public void setPaymentProvider(String paymentProvider) { this.paymentProvider = paymentProvider; }
        public String getExternalTransactionId() { return externalTransactionId; }
        public void setExternalTransactionId(String externalTransactionId) { this.externalTransactionId = externalTransactionId; }
        public String getHashTx() { return hashTx; }
        public void setHashTx(String hashTx) { this.hashTx = hashTx; }
        public java.time.LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(java.time.LocalDateTime createdAt) { this.createdAt = createdAt; }
    }
}
