package com.hornero.dto;

import com.hornero.model.Campaign;
import com.hornero.model.CampaignMedia;

/**
 * Lightweight campaign view for the backoffice "Curador" section: just what a
 * curator needs to spotlight a campaign (id, title, cover image, current flag).
 * Intentionally free of the payments dependency the full admin summary carries.
 */
public class CuratorCampaignResponse {

    private Long id;
    private String title;
    private String coverImageUrl;
    private boolean isSpotlight;

    public static CuratorCampaignResponse fromEntity(Campaign campaign) {
        CuratorCampaignResponse response = new CuratorCampaignResponse();
        response.id = campaign.getId();
        response.title = campaign.getTitle();
        response.coverImageUrl = resolveCover(campaign);
        response.isSpotlight = campaign.getIsSpotlight();
        return response;
    }

    /** Prefer the primary image, else the first image; mirrors the public frontend cover logic. */
    private static String resolveCover(Campaign campaign) {
        if (campaign.getMedia() == null) return null;
        CampaignMedia firstImage = null;
        for (CampaignMedia media : campaign.getMedia()) {
            if (!"IMAGE".equalsIgnoreCase(media.getMediaType())) continue;
            if (firstImage == null) firstImage = media;
            if (Boolean.TRUE.equals(media.getIsPrimary())) {
                return imageSrc(media);
            }
        }
        return firstImage != null ? imageSrc(firstImage) : null;
    }

    private static String imageSrc(CampaignMedia media) {
        if (media.getImageUrl() != null) return media.getImageUrl();
        if (media.getUrl() != null && !media.getUrl().isBlank()) return media.getUrl();
        // Imágenes cargadas a mano se guardan como base64 sin url ni s3Key (igual que el frontend público).
        String base64 = media.getBase64Data();
        if (base64 != null && !base64.isBlank()) {
            return base64.startsWith("data:") ? base64 : "data:image/jpeg;base64," + base64;
        }
        return null;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getCoverImageUrl() { return coverImageUrl; }
    public boolean getIsSpotlight() { return isSpotlight; }
}
