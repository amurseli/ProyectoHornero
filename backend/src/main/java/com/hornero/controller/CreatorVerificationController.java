package com.hornero.controller;

import com.hornero.dto.AdminVerificationDecisionRequest;
import com.hornero.dto.CreatorVerificationRequest;
import com.hornero.dto.CreatorVerificationResponse;
import com.hornero.dto.ErrorResponse;
import com.hornero.model.CreatorBankInfo;
import com.hornero.model.CreatorIdentityDocument;
import com.hornero.model.CreatorVerification;
import com.hornero.service.CreatorVerificationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class CreatorVerificationController {

    @Autowired
    private CreatorVerificationService verificationService;

    // ═══════ Creator Endpoints ═══════

    /**
     * Submit verification request (personal info + bank info + terms).
     */
    @PostMapping("/users/me/verification")
    public ResponseEntity<?> submitVerification(
            HttpServletRequest request,
            @Valid @RequestBody CreatorVerificationRequest verificationRequest) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ErrorResponse("No autenticado", HttpStatus.UNAUTHORIZED.value()));
            }

            CreatorVerification verification = verificationService.submitVerification(userId, verificationRequest);

            return ResponseEntity.ok(Map.of(
                    "message", "Solicitud de verificación enviada correctamente",
                    "status", verification.getVerificationStatus().name()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    /**
     * Upload an identity document (DNI_FRONT, DNI_BACK, SELFIE_WITH_DNI).
     */
    @PostMapping(value = "/users/me/verification/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadDocument(
            HttpServletRequest request,
            @RequestParam("documentType") String documentType,
            @RequestParam("file") MultipartFile file) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ErrorResponse("No autenticado", HttpStatus.UNAUTHORIZED.value()));
            }

            CreatorIdentityDocument doc = verificationService.uploadDocument(
                    userId,
                    documentType,
                    file.getBytes(),
                    file.getContentType()
            );

            return ResponseEntity.ok(Map.of(
                    "message", "Documento subido correctamente",
                    "documentType", doc.getDocumentType().name()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error al subir el documento", HttpStatus.INTERNAL_SERVER_ERROR.value()));
        }
    }

    /**
     * Get current user's verification status.
     */
    @GetMapping("/users/me/verification")
    public ResponseEntity<?> getMyVerification(HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ErrorResponse("No autenticado", HttpStatus.UNAUTHORIZED.value()));
            }

            CreatorVerification verification = verificationService.getVerification(userId);
            if (verification == null) {
                return ResponseEntity.ok(Map.of("status", "NOT_SUBMITTED"));
            }

            CreatorBankInfo bankInfo = verificationService.getBankInfo(userId);
            List<CreatorIdentityDocument> documents = verificationService.getDocuments(userId);

            return ResponseEntity.ok(CreatorVerificationResponse.fromEntities(verification, bankInfo, documents));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    // ═══════ Admin Endpoints ═══════

    /**
     * Get all pending verifications (admin only).
     */
    @GetMapping("/admin/verifications")
    public ResponseEntity<?> getVerifications(
            HttpServletRequest request,
            @RequestParam(value = "status", required = false) String status) {
        try {
            String userRole = (String) request.getAttribute("userRole");
            if (!"ADMIN".equals(userRole)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ErrorResponse("Acceso denegado", HttpStatus.FORBIDDEN.value()));
            }

            List<CreatorVerification> verifications = verificationService.getVerificationsByStatus(status);

            List<CreatorVerificationResponse> responses = verifications.stream()
                    .map(v -> {
                        CreatorBankInfo bankInfo = verificationService.getBankInfo(v.getUser().getId());
                        List<CreatorIdentityDocument> docs = verificationService.getDocuments(v.getUser().getId());
                        CreatorVerificationResponse resp = CreatorVerificationResponse.forAdmin(v, bankInfo, docs);
                        // Decrypt sensitive fields for admin
                        resp.setDniNumberMasked(verificationService.decryptField(v.getDniNumber()));
                        resp.setCuilNumberMasked(verificationService.decryptField(v.getCuilNumber()));
                        if (v.getCuitNumber() != null) {
                            resp.setCuitNumberMasked(verificationService.decryptField(v.getCuitNumber()));
                        }
                        if (bankInfo != null) {
                            resp.setAccountNumberMasked(verificationService.decryptField(bankInfo.getAccountNumber()));
                        }
                        return resp;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(responses);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    /**
     * Get a single verification detail (admin only).
     */
    @GetMapping("/admin/verifications/{id}")
    public ResponseEntity<?> getVerificationDetail(
            HttpServletRequest request,
            @PathVariable Long id) {
        try {
            String userRole = (String) request.getAttribute("userRole");
            if (!"ADMIN".equals(userRole)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ErrorResponse("Acceso denegado", HttpStatus.FORBIDDEN.value()));
            }

            CreatorVerification verification = verificationService.getPendingVerifications().stream()
                    .filter(v -> v.getId().equals(id))
                    .findFirst()
                    .orElse(null);

            if (verification == null) {
                // Try across all
                verification = verificationService.getAllVerifications().stream()
                        .filter(v -> v.getId().equals(id))
                        .findFirst()
                        .orElseThrow(() -> new RuntimeException("Solicitud no encontrada"));
            }

            CreatorBankInfo bankInfo = verificationService.getBankInfo(verification.getUser().getId());
            List<CreatorIdentityDocument> docs = verificationService.getDocuments(verification.getUser().getId());
            CreatorVerificationResponse resp = CreatorVerificationResponse.forAdmin(verification, bankInfo, docs);

            // Decrypt sensitive fields for admin
            resp.setDniNumberMasked(verificationService.decryptField(verification.getDniNumber()));
            resp.setCuilNumberMasked(verificationService.decryptField(verification.getCuilNumber()));
            if (verification.getCuitNumber() != null) {
                resp.setCuitNumberMasked(verificationService.decryptField(verification.getCuitNumber()));
            }
            if (bankInfo != null) {
                resp.setAccountNumberMasked(verificationService.decryptField(bankInfo.getAccountNumber()));
            }

            return ResponseEntity.ok(resp);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    /**
     * Approve or reject a verification (admin only).
     */
    @PostMapping("/admin/verifications/{id}/decision")
    public ResponseEntity<?> decideVerification(
            HttpServletRequest request,
            @PathVariable Long id,
            @Valid @RequestBody AdminVerificationDecisionRequest decisionRequest) {
        try {
            String userRole = (String) request.getAttribute("userRole");
            String adminEmail = (String) request.getAttribute("userEmail");
            if (!"ADMIN".equals(userRole)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ErrorResponse("Acceso denegado", HttpStatus.FORBIDDEN.value()));
            }

            CreatorVerification result;
            if ("APPROVED".equals(decisionRequest.getDecision())) {
                result = verificationService.approveVerification(id, adminEmail);
            } else if ("REJECTED".equals(decisionRequest.getDecision())) {
                if (decisionRequest.getRejectionReason() == null || decisionRequest.getRejectionReason().isBlank()) {
                    return ResponseEntity.badRequest()
                            .body(new ErrorResponse("Debe proporcionar una razón de rechazo", HttpStatus.BAD_REQUEST.value()));
                }
                result = verificationService.rejectVerification(id, adminEmail, decisionRequest.getRejectionReason());
            } else {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("Decisión inválida. Use APPROVED o REJECTED", HttpStatus.BAD_REQUEST.value()));
            }

            return ResponseEntity.ok(Map.of(
                    "message", "Decisión procesada correctamente",
                    "status", result.getVerificationStatus().name()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    /**
     * Get a pre-signed URL for an identity document (admin only).
     */
    @GetMapping("/admin/verifications/documents/{documentId}/url")
    public ResponseEntity<?> getDocumentUrl(
            HttpServletRequest request,
            @PathVariable Long documentId) {
        try {
            String userRole = (String) request.getAttribute("userRole");
            if (!"ADMIN".equals(userRole)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ErrorResponse("Acceso denegado", HttpStatus.FORBIDDEN.value()));
            }

            String url = verificationService.getDocumentUrl(documentId);
            return ResponseEntity.ok(Map.of("url", url));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }
}
