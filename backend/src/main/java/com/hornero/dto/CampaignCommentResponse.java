package com.hornero.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class CampaignCommentResponse {
    private Long id;
    private Long parentCommentId;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean creatorReply;
    private CampaignCommentAuthorResponse author;
    private List<CampaignCommentResponse> replies = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getParentCommentId() { return parentCommentId; }
    public void setParentCommentId(Long parentCommentId) { this.parentCommentId = parentCommentId; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public boolean isCreatorReply() { return creatorReply; }
    public void setCreatorReply(boolean creatorReply) { this.creatorReply = creatorReply; }

    public CampaignCommentAuthorResponse getAuthor() { return author; }
    public void setAuthor(CampaignCommentAuthorResponse author) { this.author = author; }

    public List<CampaignCommentResponse> getReplies() { return replies; }
    public void setReplies(List<CampaignCommentResponse> replies) { this.replies = replies; }
}
