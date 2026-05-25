package com.hornero.controller;

import com.hornero.dto.AdminCampaignContributionResponse;
import com.hornero.dto.AdminCampaignDetailResponse;
import com.hornero.dto.AdminCampaignSummaryResponse;
import com.hornero.model.Campaign;
import com.hornero.model.User;
import com.hornero.model.payments.PaymentContribution;
import com.hornero.model.payments.PaymentTransaction;
import com.hornero.repository.CampaignRepository;
import com.hornero.repository.PaymentContributionRepository;
import com.hornero.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/creator/campaigns")
public class CreatorCampaignController {

    private final CampaignRepository campaignRepository;
    private final PaymentContributionRepository paymentContributionRepository;
    private final UserRepository userRepository;

    public CreatorCampaignController(
            CampaignRepository campaignRepository,
            PaymentContributionRepository paymentContributionRepository,
            UserRepository userRepository) {
        this.campaignRepository = campaignRepository;
        this.paymentContributionRepository = paymentContributionRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/{id}/details")
    public ResponseEntity<?> getCampaignDetails(HttpServletRequest request, @PathVariable Long id) {
        Long userId = (Long) request.getAttribute("userId");
        String userRole = (String) request.getAttribute("userRole");

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "No autenticado"));
        }

        Campaign campaign = campaignRepository.findByIdWithRelations(id).orElse(null);
        if (campaign == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Campaña no encontrada"));
        }

        boolean isAdmin = "ADMIN".equals(userRole);
        boolean isOwner = campaign.getOwner() != null && campaign.getOwner().getId().equals(userId);
        if (!isAdmin && !isOwner) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Acceso denegado"));
        }

        var contributions = paymentContributionRepository.findDetailedByCampaignId(id);
        var usersById = userRepository.findAllById(
                contributions.stream().map(PaymentContribution::getIdUser).distinct().toList()
        ).stream().collect(Collectors.toMap(User::getId, user -> user));

        long approvedCount = contributions.stream().filter(c -> "APPROVED".equals(c.getStatus())).count();
        AdminCampaignDetailResponse response = new AdminCampaignDetailResponse();
        response.setCampaign(AdminCampaignSummaryResponse.fromEntity(campaign, LocalDate.now(), approvedCount));
        response.setApprovedContributionCount(approvedCount);
        response.setApprovedAmount(paymentContributionRepository.sumAmountByCampaignAndStatus(id, "APPROVED"));
        response.setContributions(contributions.stream()
                .map(contribution -> toContributionResponse(contribution, usersById.get(contribution.getIdUser())))
                .collect(Collectors.toList()));

        return ResponseEntity.ok(response);
    }

    private AdminCampaignContributionResponse toContributionResponse(PaymentContribution contribution, User user) {
        AdminCampaignContributionResponse response = new AdminCampaignContributionResponse();
        response.setContributionId(contribution.getId());
        response.setContributorUserId(contribution.getIdUser());
        response.setContributorName(buildUserName(user));
        response.setContributorEmail(user != null ? user.getEmail() : null);
        response.setAmount(contribution.getAmount());
        response.setRewardId(contribution.getRewardId());
        response.setRewardPrice(contribution.getRewardPrice());
        response.setStatus(contribution.getStatus());
        response.setCreatedAt(contribution.getCreatedAt());
        response.setUpdatedAt(contribution.getUpdatedAt());

        PaymentTransaction transaction = contribution.getTransaction();
        if (transaction != null) {
            AdminCampaignContributionResponse.TransactionInfo tx = new AdminCampaignContributionResponse.TransactionInfo();
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

    private String buildUserName(User user) {
        if (user == null) return null;
        String fullName = ((user.getFirstName() != null ? user.getFirstName() : "") + " "
                + (user.getLastName() != null ? user.getLastName() : "")).trim();
        return !fullName.isBlank() ? fullName : user.getUserName();
    }
}
