package com.hornero.service;

import com.hornero.dto.CampaignCommentAuthorResponse;
import com.hornero.dto.CampaignCommentRequest;
import com.hornero.dto.CampaignCommentResponse;
import com.hornero.model.Campaign;
import com.hornero.model.CampaignComment;
import com.hornero.model.User;
import com.hornero.model.UserConnection;
import com.hornero.repository.CampaignCommentRepository;
import com.hornero.repository.CampaignRepository;
import com.hornero.repository.UserConnectionRepository;
import com.hornero.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
public class CampaignCommentService {

    public static final int MAX_CONTENT_LENGTH = 500;

    private final CampaignCommentRepository campaignCommentRepository;
    private final CampaignRepository campaignRepository;
    private final UserRepository userRepository;
    private final UserConnectionRepository userConnectionRepository;
    private final AppImageService appImageService;

    public CampaignCommentService(
            CampaignCommentRepository campaignCommentRepository,
            CampaignRepository campaignRepository,
            UserRepository userRepository,
            UserConnectionRepository userConnectionRepository,
            AppImageService appImageService
    ) {
        this.campaignCommentRepository = campaignCommentRepository;
        this.campaignRepository = campaignRepository;
        this.userRepository = userRepository;
        this.userConnectionRepository = userConnectionRepository;
        this.appImageService = appImageService;
    }

    @Transactional(readOnly = true)
    public List<CampaignCommentResponse> listByCampaign(Long campaignId, Long requestingUserId, String requestingUserRole) {
        Campaign campaign = requireVisibleCampaign(campaignId, requestingUserId, requestingUserRole);
        List<CampaignComment> comments = campaignCommentRepository.findByCampaignIdOrderByCreatedAtAsc(campaignId);
        return buildCommentTree(comments, campaign.getOwner() != null ? campaign.getOwner().getId() : null);
    }

    @Transactional
    public CampaignCommentResponse create(Long campaignId, CampaignCommentRequest request, Long requestingUserId, String requestingUserRole) {
        Campaign campaign = requireVisibleCampaign(campaignId, requestingUserId, requestingUserRole);
        User author = userRepository.findById(requestingUserId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        CampaignComment comment = new CampaignComment();
        comment.setCampaign(campaign);
        comment.setAuthor(author);
        comment.setContent(normalizeContent(request != null ? request.getContent() : null));

        if (request != null && request.getParentCommentId() != null) {
            CampaignComment parent = campaignCommentRepository.findByIdAndCampaignId(request.getParentCommentId(), campaignId)
                    .orElseThrow(() -> new RuntimeException("Comentario padre no encontrado"));
            comment.setParentComment(parent);
        }

        CampaignComment saved = campaignCommentRepository.save(comment);
        return toResponse(
                saved,
                campaign.getOwner() != null ? campaign.getOwner().getId() : null,
                resolveAvatarMap(Set.of(author.getId()))
        );
    }

    private Campaign requireVisibleCampaign(Long campaignId, Long requestingUserId, String requestingUserRole) {
        Campaign campaign = campaignRepository.findByIdWithRelations(campaignId)
                .orElseThrow(() -> new RuntimeException("Campaña no encontrada"));

        String status = campaign.getStatus();
        if ("CROWDFUNDING".equals(status) || "SUCCESSFUL".equals(status) || "FAILED".equals(status)) {
            return campaign;
        }

        boolean isAdmin = "ADMIN".equals(requestingUserRole);
        boolean isOwner = requestingUserId != null
                && campaign.getOwner() != null
                && campaign.getOwner().getId().equals(requestingUserId);
        if (!isAdmin && !isOwner) {
            throw new SecurityException("Acceso denegado");
        }
        return campaign;
    }

    private String normalizeContent(String rawContent) {
        String content = rawContent == null ? "" : rawContent.trim();
        if (content.isBlank()) {
            throw new IllegalArgumentException("El comentario es obligatorio");
        }
        if (content.length() > MAX_CONTENT_LENGTH) {
            throw new IllegalArgumentException("El comentario no puede superar los " + MAX_CONTENT_LENGTH + " caracteres");
        }
        return content;
    }

    private List<CampaignCommentResponse> buildCommentTree(List<CampaignComment> comments, Long ownerId) {
        Map<Long, CampaignCommentResponse> byId = new LinkedHashMap<>();
        Map<Long, String> avatarMap = resolveAvatarMap(
                comments.stream()
                        .map(CampaignComment::getAuthor)
                        .filter(Objects::nonNull)
                        .map(User::getId)
                        .filter(Objects::nonNull)
                        .collect(java.util.stream.Collectors.toSet())
        );

        for (CampaignComment comment : comments) {
            byId.put(comment.getId(), toResponse(comment, ownerId, avatarMap));
        }

        List<CampaignCommentResponse> roots = new ArrayList<>();
        for (CampaignComment comment : comments) {
            CampaignCommentResponse response = byId.get(comment.getId());
            Long parentId = comment.getParentComment() != null ? comment.getParentComment().getId() : null;
            if (parentId == null) {
                roots.add(response);
                continue;
            }
            CampaignCommentResponse parent = byId.get(parentId);
            if (parent == null) {
                roots.add(response);
                continue;
            }
            parent.getReplies().add(response);
        }

        java.util.Collections.reverse(roots);
        return roots;
    }

    private CampaignCommentResponse toResponse(CampaignComment comment, Long ownerId, Map<Long, String> avatarMap) {
        CampaignCommentResponse response = new CampaignCommentResponse();
        response.setId(comment.getId());
        response.setParentCommentId(comment.getParentComment() != null ? comment.getParentComment().getId() : null);
        response.setContent(comment.getContent());
        response.setCreatedAt(comment.getCreatedAt());
        response.setUpdatedAt(comment.getUpdatedAt());

        User author = comment.getAuthor();
        Long authorId = author != null ? author.getId() : null;
        response.setCreatorReply(ownerId != null && ownerId.equals(authorId));
        response.setAuthor(new CampaignCommentAuthorResponse(
                authorId,
                resolveUserName(author),
                authorId != null ? avatarMap.get(authorId) : null
        ));
        return response;
    }

    private String resolveUserName(User author) {
        if (author == null) return "Usuario";
        if (author.getUserName() != null && !author.getUserName().isBlank()) return author.getUserName();
        String fullName = ((author.getFirstName() == null ? "" : author.getFirstName().trim()) + " " +
                (author.getLastName() == null ? "" : author.getLastName().trim())).trim();
        if (!fullName.isBlank()) return fullName;
        return "Usuario";
    }

    private Map<Long, String> resolveAvatarMap(Set<Long> userIds) {
        if (userIds == null || userIds.isEmpty()) return Map.of();

        Map<Long, String> avatars = new HashMap<>();
        List<User> users = userRepository.findAllById(userIds);
        for (User user : users) {
            if (user == null || user.getId() == null) continue;
            String avatarS3Key = user.getAvatarS3Key();
            if (avatarS3Key == null || avatarS3Key.isBlank()) continue;
            String avatarUrl = appImageService.resolveImageUrl(avatarS3Key);
            if (avatarUrl == null || avatarUrl.isBlank()) continue;
            avatars.put(user.getId(), avatarUrl);
        }

        List<UserConnection> connections = userConnectionRepository.findByUserIdInOrderByUserIdAscIdAsc(userIds);
        for (UserConnection connection : connections) {
            if (connection.getUser() == null || connection.getUser().getId() == null) continue;
            if (avatars.containsKey(connection.getUser().getId())) continue;
            String avatarUrl = connection.getProfileImageUrl();
            if (avatarUrl == null || avatarUrl.isBlank()) continue;
            avatars.put(connection.getUser().getId(), avatarUrl);
        }
        return avatars;
    }
}
