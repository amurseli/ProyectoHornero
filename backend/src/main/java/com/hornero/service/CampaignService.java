package com.hornero.service;

import com.hornero.model.Campaign;
import com.hornero.model.CampaignCategory;
import com.hornero.repository.CampaignCategoryRepository;
import com.hornero.repository.CampaignRepository;
import com.hornero.service.validator.CampaignPublishValidator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class CampaignService {

    @Autowired
    private CampaignRepository campaignRepository;

    @Autowired
    private CampaignCategoryRepository campaignCategoryRepository;

    @Autowired
    private List<CampaignPublishValidator> publishValidators;

    public Campaign createCampaign(Campaign campaign) {
        // Setear la referencia inversa para que JPA pueda persistir la relación
        if (campaign.getMedia() != null) {
            campaign.getMedia().forEach(m -> m.setCampaign(campaign));
        }
        return campaignRepository.save(campaign);
    }

    public List<Campaign> getAllCampaigns() {
        return campaignRepository.findAllWithRelations();
    }

    public List<Campaign> getPublicCampaigns() {
        return campaignRepository.findAllPublicWithRelations();
    }

    public Page<Campaign> getPublicCampaignsPaged(String search, Long categoryId, Pageable pageable) {
        String normalizedSearch = (search == null || search.isBlank()) ? null : search.trim();
        Page<Long> idPage = campaignRepository.findPublicIdsPaged(normalizedSearch, categoryId, pageable);
        List<Long> ids = idPage.getContent();
        if (ids.isEmpty()) {
            return new PageImpl<>(List.of(), pageable, idPage.getTotalElements());
        }
        List<Campaign> campaigns = campaignRepository.findAllByIdsWithRelations(ids);
        Map<Long, Integer> orderMap = new HashMap<>();
        for (int i = 0; i < ids.size(); i++) orderMap.put(ids.get(i), i);
        campaigns.sort(Comparator.comparingInt(c -> orderMap.get(c.getId())));
        return new PageImpl<>(campaigns, pageable, idPage.getTotalElements());
    }

    public List<CampaignCategory> getAllCategories() {
        return campaignCategoryRepository.findAll();
    }

    public List<Campaign> getCampaignsByOwner(Long ownerId) {
        return campaignRepository.findAllByOwnerIdWithRelations(ownerId);
    }

    public Optional<Campaign> getCampaignById(Long id) {
        return campaignRepository.findByIdWithRelations(id);
    }

    public Campaign updateCampaign(Long id, Campaign details) {
        Campaign existing = campaignRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campaña no encontrada"));

        existing.setTitle(details.getTitle());
        existing.setDescription(details.getDescription());
        existing.setShortDescription(details.getShortDescription());
        existing.setStatus(details.getStatus());
        existing.setStartDate(details.getStartDate());
        existing.setEndDate(details.getEndDate());
        existing.setTargetAmount(details.getTargetAmount());
        existing.setOwner(details.getOwner());
        existing.setCategory(details.getCategory());

        return campaignRepository.save(existing);
    }

    public void deleteCampaign(Long id) {
        if (!campaignRepository.existsById(id)) {
            throw new RuntimeException("Campaña no encontrada");
        }
        campaignRepository.deleteById(id);
    }

    @Transactional
    public Campaign publishCampaign(Long campaignId, Long requestingUserId, String requestingUserRole) {
        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campaña no encontrada"));

        boolean isAdmin = "ADMIN".equals(requestingUserRole);
        boolean isOwner = campaign.getOwner() != null && campaign.getOwner().getId().equals(requestingUserId);
        if (!isAdmin && !isOwner) {
            throw new SecurityException("No tenés permiso para publicar esta campaña");
        }

        if (!"DRAFT".equals(campaign.getStatus())) {
            throw new IllegalStateException("Solo se pueden publicar campañas en estado DRAFT (estado actual: " + campaign.getStatus() + ")");
        }

        publishValidators.forEach(v -> v.validate(campaign));

        campaign.setStatus("CROWDFUNDING");
        return campaignRepository.save(campaign);
    }

    // Llamado internamente por el payments service cuando una contribucion es aprobada
    @Transactional
    public void addToCampaignAmount(Long campaignId, BigDecimal amount) {
        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campaña no encontrada: " + campaignId));
        campaign.setCurrentAmount(campaign.getCurrentAmount().add(amount));
        campaignRepository.save(campaign);
    }

    @Transactional
    public void updateMoneyStatus(Long campaignId, String moneyStatus) {
        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campaña no encontrada: " + campaignId));
        campaign.setMoneyStatus(moneyStatus);
        campaignRepository.save(campaign);
    }

    // Finaliza una campaña vencida: cambia su status según si alcanzó la meta.
    // Idempotente: si ya no está en CROWDFUNDING, no hace nada.
    @Transactional
    public boolean finalizeCampaign(Campaign campaign) {
        if (!"CROWDFUNDING".equals(campaign.getStatus())) {
            return false;
        }
        boolean reachedGoal = campaign.getCurrentAmount().compareTo(campaign.getTargetAmount()) >= 0;
        if (reachedGoal) {
            campaign.setStatus("SUCCESSFUL");
            campaign.setMoneyStatus("PAYOUT_PENDING");
        } else {
            campaign.setStatus("FAILED");
            campaign.setMoneyStatus("REFUND_PENDING");
        }
        campaignRepository.save(campaign);
        return true;
    }

    public List<Campaign> findExpiredCrowdfundingCampaigns() {
        return campaignRepository.findExpiredCrowdfundingCampaigns(LocalDate.now());
    }

    public List<Campaign> findSuccessfulWithPendingPayout() {
        return campaignRepository.findSuccessfulWithPendingPayout();
    }

    public List<Campaign> findFailedWithPartialRefund() {
        return campaignRepository.findFailedWithPartialRefund();
    }
}