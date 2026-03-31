package com.hornero.service;

import com.hornero.model.Campaign;
import com.hornero.repository.CampaignRepository;
import com.hornero.service.validator.CampaignPublishValidator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class CampaignService {

    @Autowired
    private CampaignRepository campaignRepository;

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
}