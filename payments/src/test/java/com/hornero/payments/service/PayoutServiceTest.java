package com.hornero.payments.service;

import com.hornero.payments.client.BackendClient;
import com.hornero.payments.client.LedgerClient;
import com.hornero.payments.dto.PayoutStatusResponse;
import com.hornero.payments.model.Contribution;
import com.hornero.payments.model.Payout;
import com.hornero.payments.repository.ContributionRepository;
import com.hornero.payments.repository.PayoutRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PayoutServiceTest {

    @Mock PayoutRepository payoutRepository;
    @Mock ContributionRepository contributionRepository;
    @Mock BackendClient backendClient;
    @Mock LedgerClient ledgerClient;
    @Mock PaymentEventLogService paymentEventLogService;
    @Mock PayoutPersistenceService payoutPersistenceService;

    @InjectMocks PayoutService service;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "platformRate", new BigDecimal("0.05"));
        ReflectionTestUtils.setField(service, "providerRate", new BigDecimal("0.046"));
    }

    @Test
    void executePayout_whenPayoutAlreadyExists_returnsExistingPayoutWithoutRecalculating() {
        Payout existing = new Payout();
        existing.setIdCampaign(1L);
        existing.setStatus("PENDING_MANUAL_TRANSFER");
        ReflectionTestUtils.setField(existing, "id", 5L);

        when(payoutRepository.existsByIdCampaign(1L)).thenReturn(true);
        when(payoutRepository.findByIdCampaign(1L)).thenReturn(java.util.Optional.of(existing));

        PayoutStatusResponse response = service.executePayout(1L, 10L);

        assertThat(response.getPayoutId()).isEqualTo(5L);
        assertThat(response.getStatus()).isEqualTo("PENDING_MANUAL_TRANSFER");
        verify(backendClient, never()).validateCampaignSuccessful(any());
        verify(payoutRepository, never()).save(any());
    }

    @Test
    void executePayout_whenNoApprovedContributions_throwsIllegalState() {
        when(payoutRepository.existsByIdCampaign(1L)).thenReturn(false);
        when(backendClient.getCreatorPayoutCbu(10L)).thenReturn("0000000000000000000000");
        when(contributionRepository.findByIdCampaignAndStatus(1L, "APPROVED")).thenReturn(List.of());

        assertThatThrownBy(() -> service.executePayout(1L, 10L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("contribuciones aprobadas");
    }

    @Test
    void executePayout_happyPath_calculatesFeesCorrectly() {
        when(payoutRepository.existsByIdCampaign(1L)).thenReturn(false);
        when(backendClient.getCreatorPayoutCbu(10L)).thenReturn("0000000000000000000000");
        when(contributionRepository.findByIdCampaignAndStatus(1L, "APPROVED"))
                .thenReturn(List.of(contribution(new BigDecimal("1000"))));
        when(payoutPersistenceService.saveNew(any())).thenAnswer(inv -> {
            Payout p = inv.getArgument(0);
            ReflectionTestUtils.setField(p, "id", 1L);
            return p;
        });

        PayoutStatusResponse response = service.executePayout(1L, 10L);

        // gross=1000, platform=50.00 (5%), provider=46.00 (4.60%), net=904.00
        assertThat(response.getGrossAmount()).isEqualByComparingTo("1000");
        assertThat(response.getPlatformFee()).isEqualByComparingTo("50.00");
        assertThat(response.getProviderFee()).isEqualByComparingTo("46.00");
        assertThat(response.getNetAmount()).isEqualByComparingTo("904.00");
    }

    @Test
    void confirmManualPayout_registersBlockchainTransfer() {
        Payout payout = new Payout();
        payout.setIdCampaign(1L);
        payout.setIdCreatorUser(10L);
        payout.setNetAmount(new BigDecimal("920.10"));
        payout.setStatus("PENDING_MANUAL_TRANSFER");
        ReflectionTestUtils.setField(payout, "id", 7L);

        when(payoutRepository.findByIdCampaign(1L)).thenReturn(java.util.Optional.of(payout));
        when(backendClient.getCampaignTitle(1L)).thenReturn("Campaña Solar");
        when(backendClient.getUsername(10L)).thenReturn("creador1");
        when(ledgerClient.registerPayoutTransaction("creador1", payout, "Campaña Solar")).thenReturn("0xpayout");

        PayoutStatusResponse response = service.confirmManualPayout(1L, "MP-REF-1");

        assertThat(response.getStatus()).isEqualTo("COMPLETED");
        assertThat(response.getHashTx()).isEqualTo("0xpayout");
    }

    @Test
    void executePayout_happyPath_savesPayoutWithProcessingStatus() {
        when(payoutRepository.existsByIdCampaign(1L)).thenReturn(false);
        when(backendClient.getCreatorPayoutCbu(10L)).thenReturn("0000000000000000000000");
        when(contributionRepository.findByIdCampaignAndStatus(1L, "APPROVED"))
                .thenReturn(List.of(contribution(new BigDecimal("500"))));
        when(payoutPersistenceService.saveNew(any())).thenAnswer(inv -> {
            Payout p = inv.getArgument(0);
            ReflectionTestUtils.setField(p, "id", 1L);
            return p;
        });

        PayoutStatusResponse response = service.executePayout(1L, 10L);

        assertThat(response.getStatus()).isEqualTo("PENDING_MANUAL_TRANSFER");
    }

    @Test
    void executePayout_whenConcurrentInsertViolatesUniqueConstraint_returnsExistingPayout() {
        when(payoutRepository.existsByIdCampaign(1L)).thenReturn(false);
        when(backendClient.getCreatorPayoutCbu(10L)).thenReturn("0000000000000000000000");
        when(contributionRepository.findByIdCampaignAndStatus(1L, "APPROVED"))
                .thenReturn(List.of(contribution(new BigDecimal("1000"))));
        when(payoutPersistenceService.saveNew(any()))
                .thenThrow(new DataIntegrityViolationException("duplicate key value violates unique constraint uq_payout_campaign"));

        Payout existing = new Payout();
        existing.setIdCampaign(1L);
        existing.setStatus("PENDING_MANUAL_TRANSFER");
        ReflectionTestUtils.setField(existing, "id", 3L);
        when(payoutRepository.findByIdCampaign(1L)).thenReturn(java.util.Optional.of(existing));

        PayoutStatusResponse response = service.executePayout(1L, 10L);

        assertThat(response.getPayoutId()).isEqualTo(3L);
        assertThat(response.getStatus()).isEqualTo("PENDING_MANUAL_TRANSFER");
    }

    private Contribution contribution(BigDecimal amount) {
        Contribution c = new Contribution();
        c.setIdCampaign(1L);
        c.setAmount(amount);
        c.setStatus("APPROVED");
        return c;
    }
}
