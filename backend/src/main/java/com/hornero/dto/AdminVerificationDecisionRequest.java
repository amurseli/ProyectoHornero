package com.hornero.dto;

import jakarta.validation.constraints.NotBlank;

public class AdminVerificationDecisionRequest {

    @NotBlank(message = "La acción es obligatoria (APPROVED o REJECTED)")
    private String decision;

    private String rejectionReason;

    public String getDecision() { return decision; }
    public void setDecision(String decision) { this.decision = decision; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
}
