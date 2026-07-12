package com.hornero.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CampaignCommentRequest {
    @NotBlank(message = "El comentario no puede estar vacío")
    @Size(max = 500, message = "El comentario no puede superar los 500 caracteres")
    private String content;
    private Long parentCommentId;

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public Long getParentCommentId() { return parentCommentId; }
    public void setParentCommentId(Long parentCommentId) { this.parentCommentId = parentCommentId; }
}
