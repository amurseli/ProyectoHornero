package com.hornero.controller;

import com.hornero.client.PaymentsServiceClient;
import com.hornero.dto.AdminCampaignPayoutResponse;
import com.hornero.dto.AdminCampaignDetailResponse;
import com.hornero.dto.AdminCampaignContributionResponse;
import com.hornero.dto.AdminCampaignSummaryResponse;
import com.hornero.dto.AdminCampaignTransferResponse;
import com.hornero.dto.ErrorResponse;
import com.hornero.model.Campaign;
import com.hornero.model.CreatorBankInfo;
import com.hornero.model.User;
import com.hornero.model.payments.PaymentContribution;
import com.hornero.model.payments.PaymentTransaction;
import com.hornero.repository.CampaignRepository;
import com.hornero.repository.CreatorBankInfoRepository;
import com.hornero.repository.PaymentContributionRepository;
import com.hornero.repository.UserRepository;
import com.hornero.service.CampaignService;
import com.hornero.service.EncryptionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/campaigns")
public class AdminCampaignController {

    @Autowired
    private CampaignRepository campaignRepository;

    @Autowired
    private CampaignService campaignService;

    @Autowired
    private CreatorBankInfoRepository creatorBankInfoRepository;

    @Autowired
    private EncryptionService encryptionService;

    @Autowired
    private PaymentsServiceClient paymentsServiceClient;

    @Autowired
    private PaymentContributionRepository paymentContributionRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> listCampaigns(HttpServletRequest request) {
        if (!isAdmin(request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse("Acceso denegado", HttpStatus.FORBIDDEN.value()));
        }

        LocalDate today = LocalDate.now();
        List<AdminCampaignSummaryResponse> items = campaignRepository.findAllAdminWithOwner().stream()
                .map(campaign -> AdminCampaignSummaryResponse.fromEntity(
                        campaign,
                        today,
                        paymentContributionRepository.countByIdCampaignAndStatus(campaign.getId(), "APPROVED")))
                .collect(Collectors.toList());

        return ResponseEntity.ok(items);
    }

    @GetMapping("/{id}/details")
    public ResponseEntity<?> getCampaignDetails(HttpServletRequest request, @PathVariable Long id) {
        if (!isAdmin(request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse("Acceso denegado", HttpStatus.FORBIDDEN.value()));
        }

        try {
            Campaign campaign = campaignRepository.findByIdWithRelations(id)
                    .orElseThrow(() -> new RuntimeException("Campaña no encontrada"));

            List<PaymentContribution> contributions = paymentContributionRepository.findDetailedByCampaignId(id);
            Map<Long, User> usersById = userRepository.findAllById(
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
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    @PostMapping("/{id}/prepare-transfer")
    public ResponseEntity<?> prepareTransfer(HttpServletRequest request, @PathVariable Long id) {
        if (!isAdmin(request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse("Acceso denegado", HttpStatus.FORBIDDEN.value()));
        }

        try {
            Campaign campaign = campaignRepository.findByIdWithRelations(id)
                    .orElseThrow(() -> new RuntimeException("Campaña no encontrada"));

            ensureTransferEligibility(campaign);
            campaign = finalizeIfNeeded(campaign);

            Long creatorId = campaign.getOwner() != null ? campaign.getOwner().getId() : null;
            if (creatorId == null) {
                throw new RuntimeException("La campaña no tiene creador asociado");
            }

            CreatorBankInfo bankInfo = creatorBankInfoRepository.findByUserId(creatorId)
                    .orElseThrow(() -> new RuntimeException("El creador no tiene datos bancarios configurados"));

            AdminCampaignPayoutResponse payout = paymentsServiceClient.createOrGetPayout(campaign.getId(), creatorId);
            return ResponseEntity.ok(buildTransferResponse(campaign, bankInfo, payout));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                    .body(new ErrorResponse(e.getMessage(), HttpStatus.UNPROCESSABLE_ENTITY.value()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    @PatchMapping("/{id}/confirm-transfer")
    public ResponseEntity<?> confirmTransfer(
            HttpServletRequest request,
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        if (!isAdmin(request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse("Acceso denegado", HttpStatus.FORBIDDEN.value()));
        }

        try {
            Campaign campaign = campaignRepository.findByIdWithRelations(id)
                    .orElseThrow(() -> new RuntimeException("Campaña no encontrada"));

            ensureTransferEligibility(campaign);
            campaign = finalizeIfNeeded(campaign);

            String transferReference = body != null ? body.get("transferReference") : null;
            AdminCampaignPayoutResponse payout = paymentsServiceClient.confirmPayout(campaign.getId(), transferReference);

            CreatorBankInfo bankInfo = creatorBankInfoRepository.findByUserId(campaign.getOwner().getId())
                    .orElseThrow(() -> new RuntimeException("El creador no tiene datos bancarios configurados"));

            Campaign refreshedCampaign = campaignRepository.findByIdWithRelations(id)
                    .orElseThrow(() -> new RuntimeException("Campaña no encontrada"));
            return ResponseEntity.ok(buildTransferResponse(refreshedCampaign, bankInfo, payout));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                    .body(new ErrorResponse(e.getMessage(), HttpStatus.UNPROCESSABLE_ENTITY.value()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    private boolean isAdmin(HttpServletRequest request) {
        return "ADMIN".equals(request.getAttribute("userRole"));
    }

    private void ensureTransferEligibility(Campaign campaign) {
        if (campaign.getEndDate() == null || !LocalDate.now().isAfter(campaign.getEndDate())) {
            throw new IllegalStateException("La campaña todavía no alcanzó su fecha de finalización");
        }
        if (campaign.getTargetAmount() == null) {
            throw new IllegalStateException("La campaña no tiene meta configurada");
        }
        if (campaign.getCurrentAmount() == null || campaign.getCurrentAmount().compareTo(campaign.getTargetAmount()) < 0) {
            throw new IllegalStateException("La campaña no alcanzó la meta, no corresponde transferir al creador");
        }
        if (paymentContributionRepository.countByIdCampaignAndStatus(campaign.getId(), "APPROVED") == 0) {
            throw new IllegalStateException("La campaña no tiene contribuciones aprobadas en payments para transferir");
        }
    }

    private Campaign finalizeIfNeeded(Campaign campaign) {
        if ("CROWDFUNDING".equals(campaign.getStatus())) {
            campaignService.finalizeCampaign(campaign);
            return campaignRepository.findByIdWithRelations(campaign.getId()).orElse(campaign);
        }
        if (!"SUCCESSFUL".equals(campaign.getStatus())) {
            throw new IllegalStateException("La campaña no está en estado SUCCESSFUL para transferir");
        }
        return campaign;
    }

    private AdminCampaignTransferResponse buildTransferResponse(
            Campaign campaign,
            CreatorBankInfo bankInfo,
            AdminCampaignPayoutResponse payout) {
        AdminCampaignTransferResponse response = new AdminCampaignTransferResponse();
        response.setCampaign(AdminCampaignSummaryResponse.fromEntity(
                campaign,
                LocalDate.now(),
                paymentContributionRepository.countByIdCampaignAndStatus(campaign.getId(), "APPROVED")));
        response.setPayout(payout);
        response.setCreatorId(campaign.getOwner().getId());
        response.setCreatorName(campaign.getOwner().getFirstName() != null || campaign.getOwner().getLastName() != null
                ? ((campaign.getOwner().getFirstName() != null ? campaign.getOwner().getFirstName() : "") + " "
                + (campaign.getOwner().getLastName() != null ? campaign.getOwner().getLastName() : "")).trim()
                : campaign.getOwner().getUserName());
        response.setCreatorEmail(campaign.getOwner().getEmail());
        response.setAccountType(bankInfo.getAccountType().name());
        response.setCbu(encryptionService.decrypt(bankInfo.getAccountNumber()));
        response.setAlias(bankInfo.getAccountAlias());
        response.setBankOrWalletName(bankInfo.getBankOrWalletName());
        response.setAccountHolderName(bankInfo.getAccountHolderName());
        return response;
    }

    private AdminCampaignContributionResponse toContributionResponse(PaymentContribution contribution, User user) {
        AdminCampaignContributionResponse response = new AdminCampaignContributionResponse();
        response.setContributionId(contribution.getId());
        response.setContributorUserId(contribution.getIdUser());
        response.setContributorName(buildUserName(user));
        response.setContributorEmail(user != null ? user.getEmail() : null);
        response.setAmount(contribution.getAmount());
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
