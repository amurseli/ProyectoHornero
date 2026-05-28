package com.hornero.payments.service;

import com.hornero.payments.dto.AdminCampaignContributionDataResponse;
import com.hornero.payments.dto.AdminCampaignPaymentDetailResponse;
import com.hornero.payments.dto.AdminCampaignPaymentSummaryResponse;
import com.hornero.payments.model.Contribution;
import com.hornero.payments.model.Transaction;
import com.hornero.payments.repository.ContributionRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminPaymentQueryService {

    private final ContributionRepository contributionRepository;

    public AdminPaymentQueryService(ContributionRepository contributionRepository) {
        this.contributionRepository = contributionRepository;
    }

    public List<AdminCampaignPaymentSummaryResponse> getCampaignSummaries(List<Long> campaignIds) {
        if (campaignIds == null || campaignIds.isEmpty()) {
            return List.of();
        }

        Map<Long, AdminCampaignPaymentSummaryResponse> summariesByCampaignId = new LinkedHashMap<>();
        for (Long campaignId : campaignIds) {
            summariesByCampaignId.put(campaignId, new AdminCampaignPaymentSummaryResponse(campaignId, 0, BigDecimal.ZERO));
        }

        for (AdminCampaignPaymentSummaryResponse summary : contributionRepository.summarizeApprovedByCampaignIds(campaignIds)) {
            summariesByCampaignId.put(summary.getCampaignId(), summary);
        }

        return new ArrayList<>(summariesByCampaignId.values());
    }

    public AdminCampaignPaymentDetailResponse getCampaignDetail(Long campaignId) {
        List<Contribution> contributions = contributionRepository.findDetailedByIdCampaign(campaignId);
        BigDecimal approvedAmount = BigDecimal.ZERO;
        long approvedContributionCount = 0;

        List<AdminCampaignContributionDataResponse> items = new ArrayList<>();
        for (Contribution contribution : contributions) {
            if ("APPROVED".equals(contribution.getStatus())) {
                approvedContributionCount++;
                approvedAmount = approvedAmount.add(contribution.getAmount() != null ? contribution.getAmount() : BigDecimal.ZERO);
            }
            items.add(toContributionResponse(contribution));
        }

        AdminCampaignPaymentDetailResponse response = new AdminCampaignPaymentDetailResponse();
        response.setCampaignId(campaignId);
        response.setApprovedAmount(approvedAmount);
        response.setApprovedContributionCount(approvedContributionCount);
        response.setContributions(items);
        return response;
    }

    private AdminCampaignContributionDataResponse toContributionResponse(Contribution contribution) {
        AdminCampaignContributionDataResponse response = new AdminCampaignContributionDataResponse();
        response.setContributionId(contribution.getId());
        response.setContributorUserId(contribution.getIdUser());
        response.setAmount(contribution.getAmount());
        response.setRewardId(contribution.getRewardId());
        response.setRewardPrice(contribution.getRewardPrice());
        response.setStatus(contribution.getStatus());
        response.setCreatedAt(contribution.getCreatedAt());
        response.setUpdatedAt(contribution.getUpdatedAt());

        Transaction transaction = contribution.getTransaction();
        if (transaction != null) {
            AdminCampaignContributionDataResponse.TransactionInfo tx = new AdminCampaignContributionDataResponse.TransactionInfo();
            tx.setTransactionId(transaction.getId());
            tx.setAmount(transaction.getAmount());
            tx.setTransactionMethod(transaction.getTransactionMethod());
            tx.setPaymentProvider(transaction.getPaymentProvider());
            tx.setExternalTransactionId(transaction.getIdTransactionExternal());
            tx.setHashTx(transaction.getHashTx());
            tx.setCreatedAt(transaction.getCreatedAt());
            response.setTransaction(tx);
        }

        return response;
    }
}
