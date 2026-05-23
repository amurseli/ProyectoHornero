package com.hornero.service;

import com.hornero.model.Campaign;
import com.hornero.model.CampaignMedia;
import com.hornero.model.CampaignTeamMember;
import com.hornero.model.Reward;
import org.springframework.stereotype.Service;

import java.net.URL;
import java.util.Base64;
import java.util.List;

@Service
public class AppImageService {

    private final S3StorageService s3StorageService;

    public AppImageService(S3StorageService s3StorageService) {
        this.s3StorageService = s3StorageService;
    }

    public void hydrateCampaign(Campaign campaign) {
        if (campaign == null || campaign.getMedia() == null) return;
        campaign.getMedia().forEach(this::hydrateCampaignMedia);
    }

    public void hydrateCampaigns(List<Campaign> campaigns) {
        if (campaigns == null) return;
        campaigns.forEach(this::hydrateCampaign);
    }

    public void hydrateCampaignMedia(CampaignMedia media) {
        if (media == null) return;
        if (!"IMAGE".equalsIgnoreCase(media.getMediaType())) return;
        media.setImageUrl(resolveStoredImageReference(media.getUrl(), media.getS3Key()));
    }

    public void hydrateRewards(List<Reward> rewards) {
        if (rewards == null) return;
        rewards.forEach(this::hydrateReward);
    }

    public void hydrateReward(Reward reward) {
        if (reward == null) return;
        reward.setImageUrl(resolveImageUrl(reward.getImageS3Key()));
    }

    public void hydrateTeamMembers(List<CampaignTeamMember> members) {
        if (members == null) return;
        members.forEach(this::hydrateTeamMember);
    }

    public void hydrateTeamMember(CampaignTeamMember member) {
        if (member == null) return;
        member.setImageUrl(resolveImageUrl(member.getImageS3Key()));
    }

    public String persistBase64Image(String folder, String base64Data) {
        if (base64Data == null || base64Data.isBlank()) return null;

        byte[] bytes = Base64.getDecoder().decode(stripDataUriPrefix(base64Data));
        String contentType = detectContentType(bytes);
        return s3StorageService.uploadAppImage(folder, bytes, contentType);
    }

    public String resolveImageUrl(String s3Key) {
        if (s3Key == null || s3Key.isBlank()) return null;
        URL url = s3StorageService.generatePresignedUrl(s3Key);
        return url != null ? url.toString() : null;
    }

    public String resolveStoredImageReference(String value, String fallbackS3Key) {
        if (value != null && !value.isBlank()) {
            if (value.startsWith("http://") || value.startsWith("https://")) return value;
            return resolveImageUrl(value);
        }
        return resolveImageUrl(fallbackS3Key);
    }

    public void deleteImage(String s3Key) {
        if (s3Key == null || s3Key.isBlank()) return;
        s3StorageService.deleteObject(s3Key);
    }

    private String stripDataUriPrefix(String value) {
        int commaIndex = value.indexOf(',');
        return commaIndex >= 0 ? value.substring(commaIndex + 1) : value;
    }

    private String detectContentType(byte[] bytes) {
        if (bytes == null || bytes.length < 12) return "application/octet-stream";

        if ((bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8 && (bytes[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        if ((bytes[0] & 0xFF) == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47) {
            return "image/png";
        }
        if (bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P') {
            return "image/webp";
        }
        return "application/octet-stream";
    }
}
