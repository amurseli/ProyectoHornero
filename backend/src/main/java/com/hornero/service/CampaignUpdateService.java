package com.hornero.service;

import com.hornero.model.Campaign;
import com.hornero.model.CampaignUpdate;
import com.hornero.repository.CampaignRepository;
import com.hornero.repository.CampaignUpdateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CampaignUpdateService {

    public static final int MAX_CONTENT_LENGTH = 8000;
    private static final int MAX_TITLE_LENGTH = 180;

    private final CampaignUpdateRepository campaignUpdateRepository;
    private final CampaignRepository campaignRepository;

    public CampaignUpdateService(CampaignUpdateRepository campaignUpdateRepository, CampaignRepository campaignRepository) {
        this.campaignUpdateRepository = campaignUpdateRepository;
        this.campaignRepository = campaignRepository;
    }

    @Transactional(readOnly = true)
    public List<CampaignUpdate> listByCampaign(Long campaignId, Long requestingUserId, String requestingUserRole) {
        ensureVisibleCampaign(campaignId, requestingUserId, requestingUserRole);
        return campaignUpdateRepository.findByCampaignIdOrderByCreatedAtDesc(campaignId);
    }

    @Transactional
    public CampaignUpdate create(Long campaignId, CampaignUpdate incoming, Long requestingUserId, String requestingUserRole) {
        Campaign campaign = requireEditableCampaign(campaignId, requestingUserId, requestingUserRole);

        CampaignUpdate update = new CampaignUpdate();
        update.setCampaign(campaign);
        update.setTitle(normalizeTitle(incoming.getTitle()));
        update.setContent(normalizeContent(incoming.getContent()));
        return campaignUpdateRepository.save(update);
    }

    @Transactional
    public CampaignUpdate update(Long campaignId, Long updateId, CampaignUpdate incoming, Long requestingUserId, String requestingUserRole) {
        requireEditableCampaign(campaignId, requestingUserId, requestingUserRole);

        CampaignUpdate existing = campaignUpdateRepository.findByIdAndCampaignId(updateId, campaignId)
                .orElseThrow(() -> new RuntimeException("Actualización no encontrada"));
        existing.setTitle(normalizeTitle(incoming.getTitle()));
        existing.setContent(normalizeContent(incoming.getContent()));
        return campaignUpdateRepository.save(existing);
    }

    @Transactional
    public void delete(Long campaignId, Long updateId, Long requestingUserId, String requestingUserRole) {
        requireEditableCampaign(campaignId, requestingUserId, requestingUserRole);

        CampaignUpdate existing = campaignUpdateRepository.findByIdAndCampaignId(updateId, campaignId)
                .orElseThrow(() -> new RuntimeException("Actualización no encontrada"));
        campaignUpdateRepository.delete(existing);
    }

    private void ensureCampaignExists(Long campaignId) {
        if (!campaignRepository.existsById(campaignId)) {
            throw new RuntimeException("Campaña no encontrada");
        }
    }

    private void ensureVisibleCampaign(Long campaignId, Long requestingUserId, String requestingUserRole) {
        Campaign campaign = campaignRepository.findByIdWithRelations(campaignId)
                .orElseThrow(() -> new RuntimeException("Campaña no encontrada"));

        String status = campaign.getStatus();
        if ("CROWDFUNDING".equals(status) || "SUCCESSFUL".equals(status) || "FAILED".equals(status)) {
            return;
        }

        boolean isAdmin = "ADMIN".equals(requestingUserRole);
        boolean isOwner = requestingUserId != null
                && campaign.getOwner() != null
                && campaign.getOwner().getId().equals(requestingUserId);
        if (!isAdmin && !isOwner) {
            throw new SecurityException("Acceso denegado");
        }
    }

    private Campaign requireEditableCampaign(Long campaignId, Long requestingUserId, String requestingUserRole) {
        Campaign campaign = campaignRepository.findByIdWithRelations(campaignId)
                .orElseThrow(() -> new RuntimeException("Campaña no encontrada"));

        boolean isAdmin = "ADMIN".equals(requestingUserRole);
        boolean isOwner = requestingUserId != null
                && campaign.getOwner() != null
                && campaign.getOwner().getId().equals(requestingUserId);
        if (!isAdmin && !isOwner) {
            throw new SecurityException("No tenés permiso para editar esta campaña");
        }
        return campaign;
    }

    private String normalizeTitle(String rawTitle) {
        String title = rawTitle == null ? "" : rawTitle.trim();
        if (title.isBlank()) {
            throw new IllegalArgumentException("El título de la actualización es obligatorio");
        }
        if (title.length() > MAX_TITLE_LENGTH) {
            throw new IllegalArgumentException("El título no puede superar los " + MAX_TITLE_LENGTH + " caracteres");
        }
        return title;
    }

    private String normalizeContent(String rawContent) {
        String content = rawContent == null ? "" : rawContent.trim();
        if (content.isBlank()) {
            throw new IllegalArgumentException("El contenido de la actualización es obligatorio");
        }
        if (content.length() > MAX_CONTENT_LENGTH) {
            throw new IllegalArgumentException("La actualización no puede superar los " + MAX_CONTENT_LENGTH + " caracteres");
        }
        return content;
    }
}
