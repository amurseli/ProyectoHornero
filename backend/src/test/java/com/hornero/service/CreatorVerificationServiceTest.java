package com.hornero.service;

import com.hornero.dto.CreatorVerificationRequest;
import com.hornero.model.CreatorIdentityDocument;
import com.hornero.model.CreatorIdentityDocument.DocumentType;
import com.hornero.model.CreatorVerification;
import com.hornero.model.CreatorVerification.VerificationStatus;
import com.hornero.model.Role;
import com.hornero.model.User;
import com.hornero.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CreatorVerificationServiceTest {

    @Mock CreatorVerificationRepository verificationRepository;
    @Mock CreatorBankInfoRepository bankInfoRepository;
    @Mock CreatorIdentityDocumentRepository documentRepository;
    @Mock UserRepository userRepository;
    @Mock RoleRepository roleRepository;
    @Mock EncryptionService encryptionService;
    @Mock S3StorageService s3StorageService;

    @InjectMocks CreatorVerificationService service;

    private CreatorVerification verificationWithStatus(VerificationStatus status) {
        CreatorVerification v = new CreatorVerification();
        v.setId(1L);
        v.setVerificationStatus(status);
        v.setUser(new User());
        return v;
    }

    // --- approveVerification ---

    @Test
    void approveVerification_whenNotFound_throws() {
        when(verificationRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.approveVerification(1L, "admin@hornero.com"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("no encontrada");
    }

    @Test
    void approveVerification_whenAlreadyProcessed_throws() {
        when(verificationRepository.findById(1L))
                .thenReturn(Optional.of(verificationWithStatus(VerificationStatus.APPROVED)));

        assertThatThrownBy(() -> service.approveVerification(1L, "admin@hornero.com"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("ya fue procesada");
    }

    @Test
    void approveVerification_whenPending_approvesAndPromotesToCreator() {
        CreatorVerification v = verificationWithStatus(VerificationStatus.PENDING);
        Role creatorRole = new Role();
        when(verificationRepository.findById(1L)).thenReturn(Optional.of(v));
        when(roleRepository.findByName("CREATOR")).thenReturn(Optional.of(creatorRole));

        CreatorVerification result = service.approveVerification(1L, "admin@hornero.com");

        assertThat(result.getVerificationStatus()).isEqualTo(VerificationStatus.APPROVED);
        assertThat(result.getVerifiedBy()).isEqualTo("admin@hornero.com");
        assertThat(v.getUser().getRole()).isSameAs(creatorRole);
        verify(userRepository).save(v.getUser());
    }

    @Test
    void approveVerification_whenCreatorRoleMissing_throws() {
        when(verificationRepository.findById(1L))
                .thenReturn(Optional.of(verificationWithStatus(VerificationStatus.PENDING)));
        when(roleRepository.findByName("CREATOR")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.approveVerification(1L, "admin@hornero.com"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("CREATOR");
    }

    // --- rejectVerification ---

    @Test
    void rejectVerification_whenPending_setsRejectedWithReason() {
        CreatorVerification v = verificationWithStatus(VerificationStatus.PENDING);
        when(verificationRepository.findById(1L)).thenReturn(Optional.of(v));

        CreatorVerification result = service.rejectVerification(1L, "admin@hornero.com", "Documentación ilegible");

        assertThat(result.getVerificationStatus()).isEqualTo(VerificationStatus.REJECTED);
        assertThat(result.getRejectionReason()).isEqualTo("Documentación ilegible");
        verify(verificationRepository).save(v);
        verifyNoInteractions(userRepository);
    }

    @Test
    void rejectVerification_whenAlreadyProcessed_throws() {
        when(verificationRepository.findById(1L))
                .thenReturn(Optional.of(verificationWithStatus(VerificationStatus.REJECTED)));

        assertThatThrownBy(() -> service.rejectVerification(1L, "admin@hornero.com", "x"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("ya fue procesada");
    }

    // --- uploadDocument ---

    @Test
    void uploadDocument_withDisallowedContentType_throws() {
        when(userRepository.findById(5L)).thenReturn(Optional.of(new User()));

        assertThatThrownBy(() ->
                service.uploadDocument(5L, "DNI_FRONT", new byte[10], "application/pdf"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("no permitido");

        verifyNoInteractions(s3StorageService);
    }

    @Test
    void uploadDocument_whenFileTooLarge_throws() {
        when(userRepository.findById(5L)).thenReturn(Optional.of(new User()));
        byte[] big = new byte[5 * 1024 * 1024 + 1];

        assertThatThrownBy(() ->
                service.uploadDocument(5L, "DNI_FRONT", big, "image/png"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("demasiado grande");

        verifyNoInteractions(s3StorageService);
    }

    @Test
    void uploadDocument_whenValid_uploadsToS3AndSavesReference() {
        User user = new User();
        when(userRepository.findById(5L)).thenReturn(Optional.of(user));
        when(documentRepository.findByUserIdAndDocumentType(5L, DocumentType.DNI_FRONT))
                .thenReturn(Optional.empty());
        when(s3StorageService.uploadIdentityDocument(eq(5L), eq("DNI_FRONT"), any(), eq("image/png")))
                .thenReturn("s3/key/dni-front.png");
        when(documentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CreatorIdentityDocument doc = service.uploadDocument(5L, "DNI_FRONT", new byte[10], "image/png");

        assertThat(doc.getS3Key()).isEqualTo("s3/key/dni-front.png");
        assertThat(doc.getDocumentType()).isEqualTo(DocumentType.DNI_FRONT);
        verify(documentRepository).save(any());
    }

    @Test
    void uploadDocument_replacesExistingDocumentOfSameType() {
        User user = new User();
        CreatorIdentityDocument existing = new CreatorIdentityDocument();
        existing.setS3Key("old/key.png");
        when(userRepository.findById(5L)).thenReturn(Optional.of(user));
        when(documentRepository.findByUserIdAndDocumentType(5L, DocumentType.DNI_FRONT))
                .thenReturn(Optional.of(existing));
        when(s3StorageService.uploadIdentityDocument(any(), any(), any(), any()))
                .thenReturn("new/key.png");
        when(documentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.uploadDocument(5L, "DNI_FRONT", new byte[10], "image/png");

        verify(s3StorageService).deleteObject("old/key.png");
        verify(documentRepository).delete(existing);
    }

    // --- getVerificationsByStatus ---

    @Test
    void getVerificationsByStatus_whenBlank_returnsAll() {
        when(verificationRepository.findAll()).thenReturn(List.of());

        service.getVerificationsByStatus("  ");

        verify(verificationRepository).findAll();
        verify(verificationRepository, never()).findByVerificationStatus(any());
    }

    @Test
    void getVerificationsByStatus_whenInvalid_fallsBackToAll() {
        when(verificationRepository.findAll()).thenReturn(List.of());

        service.getVerificationsByStatus("NONSENSE");

        verify(verificationRepository).findAll();
    }

    @Test
    void getVerificationsByStatus_whenValid_filtersByStatus() {
        when(verificationRepository.findByVerificationStatus(VerificationStatus.PENDING))
                .thenReturn(List.of());

        service.getVerificationsByStatus("PENDING");

        verify(verificationRepository).findByVerificationStatus(VerificationStatus.PENDING);
        verify(verificationRepository, never()).findAll();
    }

    // --- submitVerification ---

    @Test
    void submitVerification_whenUserNotFound_throws() {
        when(userRepository.findById(5L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.submitVerification(5L, validRequest()))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Usuario");
    }

    @Test
    void submitVerification_whenPendingAlreadyExists_throws() {
        when(userRepository.findById(5L)).thenReturn(Optional.of(new User()));
        when(verificationRepository.existsByUserId(5L)).thenReturn(true);
        when(verificationRepository.findByUserId(5L))
                .thenReturn(Optional.of(verificationWithStatus(VerificationStatus.PENDING)));

        assertThatThrownBy(() -> service.submitVerification(5L, validRequest()))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("pendiente");
    }

    @Test
    void submitVerification_whenTermsNotAccepted_throws() {
        when(userRepository.findById(5L)).thenReturn(Optional.of(new User()));
        when(verificationRepository.existsByUserId(5L)).thenReturn(false);
        CreatorVerificationRequest request = validRequest();
        request.setTermsAccepted(false);

        assertThatThrownBy(() -> service.submitVerification(5L, request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("términos");
    }

    @Test
    void submitVerification_whenValid_encryptsSensitiveFieldsAndSavesBoth() {
        when(userRepository.findById(5L)).thenReturn(Optional.of(new User()));
        when(verificationRepository.existsByUserId(5L)).thenReturn(false);
        when(encryptionService.encrypt(any())).thenReturn("ENC");

        CreatorVerification result = service.submitVerification(5L, validRequest());

        assertThat(result.getVerificationStatus()).isEqualTo(VerificationStatus.PENDING);
        assertThat(result.getDniNumber()).isEqualTo("ENC");
        assertThat(result.getCuilNumber()).isEqualTo("ENC");
        verify(encryptionService).encrypt("12345678"); // DNI
        verify(encryptionService).encrypt("20123456789"); // CUIL
        verify(verificationRepository).save(any(CreatorVerification.class));
        verify(bankInfoRepository).save(any());
    }

    private CreatorVerificationRequest validRequest() {
        CreatorVerificationRequest r = new CreatorVerificationRequest();
        r.setFullLegalName("Mateo Fernández");
        r.setDniNumber("12345678");
        r.setCuilNumber("20123456789");
        r.setDateOfBirth(LocalDate.of(1995, 5, 20));
        r.setPhoneNumber("1122334455");
        r.setAddressStreet("Av. Siempreviva 742");
        r.setAddressCity("CABA");
        r.setAddressProvince("Buenos Aires");
        r.setAddressZipCode("1000");
        r.setTaxCondition("MONOTRIBUTISTA");
        r.setAccountType("CBU");
        r.setAccountNumber("0123456789012345678901");
        r.setBankOrWalletName("Banco Nación");
        r.setAccountHolderName("Mateo Fernández");
        r.setTermsAccepted(true);
        return r;
    }
}
