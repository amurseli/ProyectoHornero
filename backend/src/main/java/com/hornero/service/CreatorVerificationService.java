package com.hornero.service;

import com.hornero.dto.CreatorVerificationRequest;
import com.hornero.model.*;
import com.hornero.model.CreatorBankInfo.AccountType;
import com.hornero.model.CreatorIdentityDocument.DocumentType;
import com.hornero.model.CreatorVerification.TaxCondition;
import com.hornero.model.CreatorVerification.VerificationStatus;
import com.hornero.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CreatorVerificationService {

    @Autowired
    private CreatorVerificationRepository verificationRepository;

    @Autowired
    private CreatorBankInfoRepository bankInfoRepository;

    @Autowired
    private CreatorIdentityDocumentRepository documentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private EncryptionService encryptionService;

    @Autowired
    private S3StorageService s3StorageService;

    /**
     * Submit a full creator verification request (personal info + bank info + terms).
     * Documents are uploaded separately via uploadDocument().
     */
    @Transactional
    public CreatorVerification submitVerification(Long userId, CreatorVerificationRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (verificationRepository.existsByUserId(userId)) {
            CreatorVerification existing = verificationRepository.findByUserId(userId)
                    .orElseThrow();
            if (existing.getVerificationStatus() == VerificationStatus.PENDING) {
                throw new RuntimeException("Ya tenés una solicitud de verificación pendiente");
            }
            if (existing.getVerificationStatus() == VerificationStatus.APPROVED) {
                throw new RuntimeException("Tu cuenta ya fue verificada");
            }
            // If REJECTED, allow re-submission: delete old data
            bankInfoRepository.deleteByUserId(userId);
            documentRepository.deleteByUserId(userId);
            verificationRepository.delete(existing);
            verificationRepository.flush();
        }

        if (!Boolean.TRUE.equals(request.getTermsAccepted())) {
            throw new RuntimeException("Debe aceptar los términos y condiciones");
        }

        // Create verification record with encrypted sensitive fields
        CreatorVerification verification = new CreatorVerification();
        verification.setUser(user);
        verification.setFullLegalName(request.getFullLegalName());
        verification.setDniNumber(encryptionService.encrypt(request.getDniNumber()));
        verification.setCuilNumber(encryptionService.encrypt(request.getCuilNumber()));
        verification.setCuitNumber(request.getCuitNumber() != null
                ? encryptionService.encrypt(request.getCuitNumber()) : null);
        verification.setDateOfBirth(request.getDateOfBirth());
        verification.setPhoneNumber(request.getPhoneNumber());
        verification.setAddressStreet(request.getAddressStreet());
        verification.setAddressCity(request.getAddressCity());
        verification.setAddressProvince(request.getAddressProvince());
        verification.setAddressZipCode(request.getAddressZipCode());
        verification.setTaxCondition(TaxCondition.valueOf(request.getTaxCondition()));
        verification.setVerificationStatus(VerificationStatus.PENDING);
        verification.setTermsAccepted(true);
        verification.setTermsAcceptedAt(LocalDateTime.now());

        verificationRepository.save(verification);

        // Create bank info with encrypted account number
        CreatorBankInfo bankInfo = new CreatorBankInfo();
        bankInfo.setUser(user);
        bankInfo.setAccountType(AccountType.valueOf(request.getAccountType()));
        bankInfo.setAccountNumber(encryptionService.encrypt(request.getAccountNumber()));
        bankInfo.setAccountAlias(request.getAccountAlias());
        bankInfo.setBankOrWalletName(request.getBankOrWalletName());
        bankInfo.setAccountHolderName(request.getAccountHolderName());

        bankInfoRepository.save(bankInfo);

        return verification;
    }

    /**
     * Upload an identity document to S3 and save the reference.
     */
    @Transactional
    public CreatorIdentityDocument uploadDocument(Long userId, String documentTypeStr, byte[] fileContent, String contentType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        DocumentType documentType = DocumentType.valueOf(documentTypeStr);

        // Validate file type
        if (contentType == null || (!contentType.equals("image/jpeg") && !contentType.equals("image/png") && !contentType.equals("image/webp"))) {
            throw new RuntimeException("Tipo de archivo no permitido. Use JPEG, PNG o WebP.");
        }

        // Max 5MB
        if (fileContent.length > 5 * 1024 * 1024) {
            throw new RuntimeException("El archivo es demasiado grande. Máximo 5MB.");
        }

        // Delete existing document of same type if present
        documentRepository.findByUserIdAndDocumentType(userId, documentType).ifPresent(existing -> {
            s3StorageService.deleteObject(existing.getS3Key());
            documentRepository.delete(existing);
        });
        documentRepository.flush();

        // Upload to S3
        String s3Key = s3StorageService.uploadIdentityDocument(userId, documentTypeStr, fileContent, contentType);

        // Save reference
        CreatorIdentityDocument document = new CreatorIdentityDocument();
        document.setUser(user);
        document.setDocumentType(documentType);
        document.setS3Key(s3Key);

        return documentRepository.save(document);
    }

    /**
     * Get the current verification status for a user.
     */
    public CreatorVerification getVerification(Long userId) {
        return verificationRepository.findByUserId(userId).orElse(null);
    }

    public CreatorBankInfo getBankInfo(Long userId) {
        return bankInfoRepository.findByUserId(userId).orElse(null);
    }

    public List<CreatorIdentityDocument> getDocuments(Long userId) {
        return documentRepository.findByUserId(userId);
    }

    /**
     * Decrypt sensitive fields for admin review.
     */
    public String decryptField(String encryptedValue) {
        return encryptionService.decrypt(encryptedValue);
    }

    // ═══════ Admin Operations ═══════

    /**
     * Get all pending verification requests.
     */
    public List<CreatorVerification> getPendingVerifications() {
        return verificationRepository.findByVerificationStatus(VerificationStatus.PENDING);
    }

    /**
     * Get verifications filtered by status, or all if status is null.
     */
    public List<CreatorVerification> getVerificationsByStatus(String status) {
        if (status == null || status.isBlank()) {
            return verificationRepository.findAll();
        }
        try {
            return verificationRepository.findByVerificationStatus(VerificationStatus.valueOf(status));
        } catch (IllegalArgumentException e) {
            return verificationRepository.findAll();
        }
    }

    /**
     * Get all verifications (any status).
     */
    public List<CreatorVerification> getAllVerifications() {
        return verificationRepository.findAll();
    }

    /**
     * Approve a creator verification: set status to APPROVED and promote user to CREATOR role.
     */
    @Transactional
    public CreatorVerification approveVerification(Long verificationId, String adminEmail) {
        CreatorVerification verification = verificationRepository.findById(verificationId)
                .orElseThrow(() -> new RuntimeException("Solicitud de verificación no encontrada"));

        if (verification.getVerificationStatus() != VerificationStatus.PENDING) {
            throw new RuntimeException("Esta solicitud ya fue procesada");
        }

        verification.setVerificationStatus(VerificationStatus.APPROVED);
        verification.setVerifiedAt(LocalDateTime.now());
        verification.setVerifiedBy(adminEmail);
        verificationRepository.save(verification);

        // Promote user to CREATOR role
        User user = verification.getUser();
        Role creatorRole = roleRepository.findByName("CREATOR")
                .orElseThrow(() -> new RuntimeException("Role CREATOR not found"));
        user.setRole(creatorRole);
        userRepository.save(user);

        return verification;
    }

    /**
     * Reject a creator verification with a reason.
     */
    @Transactional
    public CreatorVerification rejectVerification(Long verificationId, String adminEmail, String reason) {
        CreatorVerification verification = verificationRepository.findById(verificationId)
                .orElseThrow(() -> new RuntimeException("Solicitud de verificación no encontrada"));

        if (verification.getVerificationStatus() != VerificationStatus.PENDING) {
            throw new RuntimeException("Esta solicitud ya fue procesada");
        }

        verification.setVerificationStatus(VerificationStatus.REJECTED);
        verification.setRejectionReason(reason);
        verification.setVerifiedAt(LocalDateTime.now());
        verification.setVerifiedBy(adminEmail);
        verificationRepository.save(verification);

        return verification;
    }

    /**
     * Generate a pre-signed URL for an identity document (admin only).
     */
    public String getDocumentUrl(Long documentId) {
        CreatorIdentityDocument document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Documento no encontrado"));
        return s3StorageService.generatePresignedUrl(document.getS3Key()).toString();
    }
}
