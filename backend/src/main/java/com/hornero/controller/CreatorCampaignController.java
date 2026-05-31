package com.hornero.controller;

import com.hornero.client.PaymentsServiceClient;
import com.hornero.dto.AdminCampaignContributionResponse;
import com.hornero.dto.AdminCampaignDetailResponse;
import com.hornero.dto.AdminCampaignSummaryResponse;
import com.hornero.dto.ErrorResponse;
import com.hornero.model.Campaign;
import com.hornero.model.User;
import com.hornero.repository.CampaignRepository;
import com.hornero.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/creator/campaigns")
public class CreatorCampaignController {

    private final CampaignRepository campaignRepository;
    private final PaymentsServiceClient paymentsServiceClient;
    private final UserRepository userRepository;

    public CreatorCampaignController(
            CampaignRepository campaignRepository,
            PaymentsServiceClient paymentsServiceClient,
            UserRepository userRepository) {
        this.campaignRepository = campaignRepository;
        this.paymentsServiceClient = paymentsServiceClient;
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

        try {
            AdminCampaignDetailResponse paymentDetail = paymentsServiceClient.fetchCampaignDetail(id);
            var contributions = paymentDetail.getContributions();
            var usersById = userRepository.findAllById(
                    contributions.stream()
                            .map(AdminCampaignContributionResponse::getContributorUserId)
                            .filter(Objects::nonNull)
                            .distinct()
                            .toList()
            ).stream().collect(Collectors.toMap(User::getId, user -> user));

            AdminCampaignDetailResponse response = new AdminCampaignDetailResponse();
            response.setCampaign(AdminCampaignSummaryResponse.fromEntity(campaign, LocalDate.now(), paymentDetail.getApprovedContributionCount()));
            response.setApprovedContributionCount(paymentDetail.getApprovedContributionCount());
            response.setApprovedAmount(paymentDetail.getApprovedAmount());
            response.setContributions(contributions.stream()
                    .map(contribution -> enrichContribution(contribution, usersById.get(contribution.getContributorUserId())))
                    .collect(Collectors.toList()));

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    private AdminCampaignContributionResponse enrichContribution(AdminCampaignContributionResponse response, User user) {
        response.setContributorName(buildUserName(user));
        response.setContributorEmail(user != null ? user.getEmail() : null);
        return response;
    }

    private String buildUserName(User user) {
        if (user == null) return null;
        String fullName = ((user.getFirstName() != null ? user.getFirstName() : "") + " "
                + (user.getLastName() != null ? user.getLastName() : "")).trim();
        return !fullName.isBlank() ? fullName : user.getUserName();
    }
}
