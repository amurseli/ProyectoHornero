package com.hornero.service;

import com.hornero.model.Campaign;
import com.hornero.model.CampaignCategory;
import com.hornero.model.CampaignMedia;
import com.hornero.repository.CampaignCategoryRepository;
import com.hornero.repository.CampaignRepository;
import com.hornero.repository.CampaignTeamMemberRepository;
import com.hornero.repository.RewardRepository;
import com.hornero.service.validator.CampaignPublishValidator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
public class CampaignService {

    @Autowired
    private CampaignRepository campaignRepository;

    @Autowired
    private CampaignCategoryRepository campaignCategoryRepository;

    @Autowired
    private RewardRepository rewardRepository;

    @Autowired
    private CampaignTeamMemberRepository campaignTeamMemberRepository;

    @Autowired
    private List<CampaignPublishValidator> publishValidators;

    @Autowired
    private AppImageService appImageService;

    public Campaign createCampaign(Campaign campaign) {
        if (campaign.getMedia() != null) {
            List<CampaignMedia> incomingMedia = new ArrayList<>(campaign.getMedia());
            campaign.getMedia().clear();
            normalizeCampaignMedia(campaign, incomingMedia);
        }
        Campaign saved = campaignRepository.save(campaign);
        appImageService.hydrateCampaign(saved);
        return saved;
    }

    public List<Campaign> getAllCampaigns() {
        List<Campaign> campaigns = campaignRepository.findAllWithRelations();
        appImageService.hydrateCampaigns(campaigns);
        return campaigns;
    }

    public List<Campaign> getPublicCampaigns() {
        List<Campaign> campaigns = campaignRepository.findAllPublicWithRelations();
        appImageService.hydrateCampaigns(campaigns);
        return campaigns;
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
        appImageService.hydrateCampaigns(campaigns);
        return new PageImpl<>(campaigns, pageable, idPage.getTotalElements());
    }

    public List<CampaignCategory> getAllCategories() {
        return campaignCategoryRepository.findAll();
    }

    public List<Campaign> getCampaignsByOwner(Long ownerId) {
        List<Campaign> campaigns = campaignRepository.findAllByOwnerIdWithRelations(ownerId);
        appImageService.hydrateCampaigns(campaigns);
        return campaigns;
    }

    public Optional<Campaign> getCampaignById(Long id) {
        Optional<Campaign> campaign = campaignRepository.findByIdWithRelations(id);
        campaign.ifPresent(appImageService::hydrateCampaign);
        return campaign;
    }

    @Transactional
    public Campaign updateCampaign(Long id, Campaign details, Long requestingUserId, String requestingUserRole) {
        Campaign existing = campaignRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campaña no encontrada"));

        boolean isAdmin = "ADMIN".equals(requestingUserRole);
        boolean isOwner = requestingUserId != null
                && existing.getOwner() != null
                && existing.getOwner().getId().equals(requestingUserId);
        if (!isAdmin && !isOwner) {
            throw new SecurityException("No tenés permiso para editar esta campaña");
        }

        boolean draftCampaign = "DRAFT".equals(existing.getStatus());

        existing.setTitle(details.getTitle());
        existing.setDescription(details.getDescription());
        existing.setShortDescription(details.getShortDescription());
        existing.setCategory(details.getCategory());
        existing.setCountry(details.getCountry());

        if (draftCampaign) {
            existing.setStartDate(details.getStartDate());
            existing.setEndDate(details.getEndDate());
            existing.setTargetAmount(details.getTargetAmount());
        }

        // Replace the media collection when the request supplies one.
        // The collection is mutated in place (orphanRemoval handles deletions)
        // and fresh CampaignMedia rows are inserted from the incoming payload.
        if (details.getMedia() != null) {
            Set<String> previousKeys = existing.getMedia().stream()
                    .filter(media -> "IMAGE".equalsIgnoreCase(media.getMediaType()))
                    .map(this::extractImageStorageRef)
                    .filter(key -> key != null && !key.isBlank())
                    .collect(java.util.stream.Collectors.toSet());

            existing.getMedia().clear();
            Set<String> retainedKeys = normalizeCampaignMedia(existing, details.getMedia());
            Campaign saved = campaignRepository.save(existing);
            deleteOrphanedKeys(previousKeys, retainedKeys);
            appImageService.hydrateCampaign(saved);
            return saved;
        }

        Campaign saved = campaignRepository.save(existing);
        appImageService.hydrateCampaign(saved);
        return saved;
    }

    public void deleteCampaign(Long id) {
        Campaign campaign = campaignRepository.findByIdWithRelations(id)
                .orElseThrow(() -> new RuntimeException("Campaña no encontrada"));

        campaign.getMedia().stream()
                .filter(media -> "IMAGE".equalsIgnoreCase(media.getMediaType()))
                .map(this::extractImageStorageRef)
                .forEach(appImageService::deleteImage);
        rewardRepository.findByCampaignIdOrderByDisplayOrderAsc(id).stream()
                .map(reward -> reward.getImageS3Key())
                .forEach(appImageService::deleteImage);
        campaignTeamMemberRepository.findByCampaignIdOrderByDisplayOrderAsc(id).stream()
                .map(member -> member.getImageS3Key())
                .forEach(appImageService::deleteImage);

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
        Campaign saved = campaignRepository.save(campaign);
        appImageService.hydrateCampaign(saved);
        return saved;
    }

    // Llamado internamente por el payments service cuando una contribucion es aprobada
    @Transactional
    public void addToCampaignAmount(Long campaignId, BigDecimal amount) {
        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campaña no encontrada: " + campaignId));
        campaign.setCurrentAmount(campaign.getCurrentAmount().add(amount));
        campaignRepository.save(campaign);
    }

    private Set<String> normalizeCampaignMedia(Campaign campaign, List<CampaignMedia> incomingMedia) {
        Set<String> retainedKeys = new HashSet<>();
        for (CampaignMedia incoming : incomingMedia) {
            CampaignMedia media = new CampaignMedia();
            media.setCampaign(campaign);
            media.setMediaType(incoming.getMediaType());
            media.setIsPrimary(incoming.getIsPrimary() != null ? incoming.getIsPrimary() : false);
            media.setDisplayOrder(incoming.getDisplayOrder() != null ? incoming.getDisplayOrder() : 0);

            if ("IMAGE".equalsIgnoreCase(incoming.getMediaType())) {
                String s3Key = extractImageStorageRef(incoming);
                if (incoming.getBase64Data() != null && !incoming.getBase64Data().isBlank()) {
                    s3Key = appImageService.persistBase64Image(buildMediaFolder(campaign), incoming.getBase64Data());
                }
                media.setUrl(s3Key);
                media.setBase64Data(null);
                media.setS3Key(null);
                if (s3Key != null && !s3Key.isBlank()) retainedKeys.add(s3Key);
            } else {
                media.setUrl(incoming.getUrl());
                media.setBase64Data(null);
                media.setS3Key(null);
            }

            campaign.getMedia().add(media);
        }
        return retainedKeys;
    }

    private void deleteOrphanedKeys(Set<String> previousKeys, Set<String> retainedKeys) {
        if (previousKeys == null || previousKeys.isEmpty()) return;
        previousKeys.stream()
                .filter(key -> !retainedKeys.contains(key))
                .forEach(appImageService::deleteImage);
    }

    private String buildMediaFolder(Campaign campaign) {
        return "media/campaign-" + (campaign.getId() != null ? campaign.getId() : "new");
    }

    private String extractImageStorageRef(CampaignMedia media) {
        if (media == null) return null;
        if (media.getUrl() != null && !media.getUrl().isBlank()) return media.getUrl();
        return media.getS3Key();
    }
}
