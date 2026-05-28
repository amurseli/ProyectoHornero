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
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
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

    private static final List<String> PUBLIC_STATUSES = List.of("CROWDFUNDING", "SUCCESSFUL", "FAILED");

    public Page<Campaign> getBrowseCampaignsPaged(String search, Long categoryId, String status, String sort, Pageable pageable) {
        String normalizedSearch = (search == null || search.isBlank()) ? "" : search.trim();
        List<String> statuses = (status == null || status.isBlank()) ? PUBLIC_STATUSES : List.of(status.toUpperCase());
        Pageable unsorted = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());
        Page<Long> idPage = switch (sort == null ? "recent" : sort) {
            case "funded" -> campaignRepository.findBrowseIdsPagedByFunded(normalizedSearch, categoryId, statuses, unsorted);
            case "ending" -> campaignRepository.findBrowseIdsPagedByEnding(normalizedSearch, categoryId, statuses, unsorted);
            default       -> campaignRepository.findBrowseIdsPagedByRecent(normalizedSearch, categoryId, statuses, unsorted);
        };
        List<Long> ids = idPage.getContent();
        if (ids.isEmpty()) {
            return new PageImpl<>(List.of(), pageable, idPage.getTotalElements());
        }
        List<Campaign> campaigns = campaignRepository.findAllByIdsWithRelations(ids);
        appImageService.hydrateCampaigns(campaigns);
        return new PageImpl<>(campaigns, pageable, idPage.getTotalElements());
    }

    public Map<String, List<Campaign>> getHomeSections(int spotlightLimit,
                                                       int featuredLimit,
                                                       int endingSoonLimit,
                                                       int nearGoalLimit,
                                                       int recentLimit) {
        LocalDate today = LocalDate.now();
        LocalDate endingSoonCutoff = today.plusDays(14);

        List<Long> spotlightIds = campaignRepository.findSpotlightIds(
                PageRequest.of(0, Math.max(1, spotlightLimit)));
        List<Long> featuredIds = campaignRepository.findFeaturedIds(
                PageRequest.of(0, Math.max(1, featuredLimit)));
        List<Long> endingSoonIds = campaignRepository.findEndingSoonIds(
                today, endingSoonCutoff, PageRequest.of(0, Math.max(1, endingSoonLimit)));
        List<Long> nearGoalIds = campaignRepository.findNearGoalIds(
                PageRequest.of(0, Math.max(1, nearGoalLimit)));
        List<Long> recentIds = campaignRepository.findRecentIds(
                PageRequest.of(0, Math.max(1, recentLimit)));

        Set<Long> allIds = new LinkedHashSet<>();
        allIds.addAll(spotlightIds);
        allIds.addAll(featuredIds);
        allIds.addAll(endingSoonIds);
        allIds.addAll(nearGoalIds);
        allIds.addAll(recentIds);

        Map<Long, Campaign> byId = new HashMap<>();
        if (!allIds.isEmpty()) {
            List<Campaign> loaded = campaignRepository.findAllByIdsWithRelations(
                    new ArrayList<>(allIds));
            appImageService.hydrateCampaigns(loaded);
            for (Campaign c : loaded) byId.put(c.getId(), c);
        }

        Map<String, List<Campaign>> result = new LinkedHashMap<>();
        result.put("spotlight",  mapIdsToCampaigns(spotlightIds,  byId));
        result.put("featured",   mapIdsToCampaigns(featuredIds,   byId));
        result.put("endingSoon", mapIdsToCampaigns(endingSoonIds, byId));
        result.put("nearGoal",   mapIdsToCampaigns(nearGoalIds,   byId));
        result.put("recent",     mapIdsToCampaigns(recentIds,     byId));
        return result;
    }

    public List<Campaign> getCategorySection(Long categoryId, int limit) {
        List<Long> ids = campaignRepository.findTopByCategoryIds(
                categoryId, PageRequest.of(0, Math.max(1, limit)));
        if (ids.isEmpty()) return List.of();
        List<Campaign> campaigns = campaignRepository.findAllByIdsWithRelations(ids);
        Map<Long, Integer> orderMap = new HashMap<>();
        for (int i = 0; i < ids.size(); i++) orderMap.put(ids.get(i), i);
        campaigns.sort(Comparator.comparingInt(c -> orderMap.get(c.getId())));
        appImageService.hydrateCampaigns(campaigns);
        return campaigns;
    }

    public List<CampaignCategory> getAllCategories() {
        return campaignCategoryRepository.findAll();
    }

    public List<CampaignCategory> getCategoriesWithActiveCampaigns() {
        return campaignCategoryRepository.findAll().stream()
                .filter(cat -> campaignRepository.countActiveByCategoryId(cat.getId()) > 0)
                .toList();
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

    public Optional<Campaign> getCampaignBySlug(String username, String titleSlug) {
        if (username == null || username.isBlank() || titleSlug == null || titleSlug.isBlank()) {
            return Optional.empty();
        }
        List<Campaign> campaigns = campaignRepository.findByOwnerUsernameWithRelations(username);
        Optional<Campaign> match = campaigns.stream()
                .filter(c -> titleSlug.equalsIgnoreCase(slugify(c.getTitle())))
                .findFirst();
        match.ifPresent(appImageService::hydrateCampaign);
        return match;
    }

    public static String slugify(String text) {
        if (text == null) return "";
        String normalized = java.text.Normalizer.normalize(text, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return normalized.toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
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

    private List<Campaign> mapIdsToCampaigns(List<Long> ids, Map<Long, Campaign> byId) {
        List<Campaign> out = new ArrayList<>(ids.size());
        for (Long id : ids) {
            Campaign c = byId.get(id);
            if (c != null) out.add(c);
        }
        return out;
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