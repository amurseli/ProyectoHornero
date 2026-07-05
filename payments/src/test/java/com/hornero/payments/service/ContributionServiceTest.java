package com.hornero.payments.service;

import com.hornero.payments.client.BackendClient;
import com.hornero.payments.client.LedgerClient;
import com.hornero.payments.dto.ContributionStatusResponse;
import com.hornero.payments.dto.InitiateContributionResponse;
import com.hornero.payments.dto.ProcessContributionRequest;
import com.hornero.payments.gateway.MercadoPagoGateway;
import com.hornero.payments.model.Contribution;
import com.hornero.payments.model.Transaction;
import com.hornero.payments.repository.ContributionRepository;
import com.hornero.payments.repository.TransactionRepository;
import com.mercadopago.client.payment.PaymentCreateRequest;
import com.mercadopago.exceptions.MPApiException;
import com.mercadopago.exceptions.MPException;
import com.mercadopago.resources.payment.Payment;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ContributionServiceTest {

    @Mock ContributionRepository contributionRepository;
    @Mock TransactionRepository transactionRepository;
    @Mock BackendClient backendClient;
    @Mock LedgerClient ledgerClient;
    @Mock MercadoPagoGateway mercadoPagoGateway;
    @Mock PaymentEventLogService paymentEventLogService;
    @Mock TransactionPersistenceService transactionPersistenceService;

    @InjectMocks ContributionService service;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "mpPublicKey", "TEST-public-key");
    }

    // --- initiate ---

    @Test
    void initiate_whenAmountIsNull_throwsIllegalArgument() {
        assertThatThrownBy(() -> service.initiate(1L, 1L, null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("monto minimo");
    }

    @Test
    void initiate_whenAmountIsZero_throwsIllegalArgument() {
        assertThatThrownBy(() -> service.initiate(1L, 1L, BigDecimal.ZERO, null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void initiate_validAmount_savesPendingContributionAndReturnsPublicKey() {
        when(contributionRepository.save(any())).thenAnswer(inv -> {
            Contribution c = inv.getArgument(0);
            ReflectionTestUtils.setField(c, "id", 42L);
            return c;
        });

        InitiateContributionResponse response = service.initiate(5L, 2L, new BigDecimal("500"), null);

        assertThat(response.getPublicKey()).isEqualTo("TEST-public-key");
        assertThat(response.getContributionId()).isEqualTo(42L);
        assertThat(response.getAmount()).isEqualByComparingTo("500");
        assertThat(response.getReward()).isNull();

        verify(contributionRepository).save(argThat(c ->
                "PENDING".equals(c.getStatus()) && c.getIdCampaign().equals(5L)
        ));
        verify(backendClient).validateCampaign(5L);
    }

    @Test
    void initiate_withReward_savesFixedTierAmountAndRewardMetadata() {
        when(contributionRepository.findByIdUserAndIdCampaign(2L, 5L)).thenReturn(List.of());
        when(backendClient.getCampaignReward(5L, 7L))
                .thenReturn(new BackendClient.RewardSummary(7L, "Tier Plata", new BigDecimal("1500")));
        when(contributionRepository.save(any())).thenAnswer(inv -> {
            Contribution c = inv.getArgument(0);
            ReflectionTestUtils.setField(c, "id", 77L);
            return c;
        });

        InitiateContributionResponse response = service.initiate(5L, 2L, null, 7L);

        assertThat(response.getAmount()).isEqualByComparingTo("1500");
        assertThat(response.getReward()).isNotNull();
        assertThat(response.getReward().getRewardId()).isEqualTo(7L);
        assertThat(response.getReward().getRewardPrice()).isEqualByComparingTo("1500");
        verify(contributionRepository).save(argThat(c ->
                c.getRewardId().equals(7L)
                        && c.getRewardPrice().compareTo(new BigDecimal("1500")) == 0
                        && c.getAmount().compareTo(new BigDecimal("1500")) == 0
        ));
    }

    @Test
    void initiate_withRewardUpgrade_chargesDifferenceOnly() {
        Contribution approvedReward = contributionWithStatus("APPROVED", 2L);
        approvedReward.setIdCampaign(5L);
        approvedReward.setRewardId(5L);
        approvedReward.setRewardPrice(new BigDecimal("1000"));
        ReflectionTestUtils.setField(approvedReward, "createdAt", LocalDateTime.now().minusDays(1));

        when(contributionRepository.findByIdUserAndIdCampaign(2L, 5L)).thenReturn(List.of(approvedReward));
        when(contributionRepository.sumApprovedAmountByUserAndCampaign(2L, 5L)).thenReturn(new BigDecimal("1000"));
        when(backendClient.getCampaignReward(5L, 9L))
                .thenReturn(new BackendClient.RewardSummary(9L, "Tier Oro", new BigDecimal("2500")));
        when(contributionRepository.save(any())).thenAnswer(inv -> {
            Contribution c = inv.getArgument(0);
            ReflectionTestUtils.setField(c, "id", 88L);
            return c;
        });

        InitiateContributionResponse response = service.initiate(5L, 2L, null, 9L);

        assertThat(response.getAmount()).isEqualByComparingTo("1500");
        assertThat(response.getReward()).isNotNull();
        assertThat(response.getReward().getPreviousRewardId()).isEqualTo(5L);
        assertThat(response.getReward().getPreviousRewardPrice()).isEqualByComparingTo("1000");
    }

    @Test
    void initiate_withSameApprovedReward_throwsIllegalState() {
        Contribution approvedReward = contributionWithStatus("APPROVED", 2L);
        approvedReward.setIdCampaign(5L);
        approvedReward.setRewardId(7L);
        approvedReward.setRewardPrice(new BigDecimal("1500"));

        when(contributionRepository.findByIdUserAndIdCampaign(2L, 5L)).thenReturn(List.of(approvedReward));
        when(backendClient.getCampaignReward(5L, 7L))
                .thenReturn(new BackendClient.RewardSummary(7L, "Tier Plata", new BigDecimal("1500")));

        assertThatThrownBy(() -> service.initiate(5L, 2L, null, 7L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Ya tenés seleccionada");
    }

    // --- process ---

    @Test
    void process_whenContributionNotFound_throwsIllegalArgument() {
        when(contributionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.process(99L, 1L, new ProcessContributionRequest()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("99");
    }

    @Test
    void process_whenUserDoesNotOwnContribution_throwsSecurityException() {
        Contribution c = contributionWithStatus("PENDING", 1L);
        when(contributionRepository.findById(1L)).thenReturn(Optional.of(c));

        assertThatThrownBy(() -> service.process(1L, 999L, new ProcessContributionRequest()))
                .isInstanceOf(SecurityException.class);
    }

    @Test
    void process_whenContributionAlreadyProcessed_throwsIllegalState() {
        Contribution c = contributionWithStatus("APPROVED", 1L);
        when(contributionRepository.findById(1L)).thenReturn(Optional.of(c));

        assertThatThrownBy(() -> service.process(1L, 1L, new ProcessContributionRequest()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("APPROVED");
    }

    @Test
    void process_whenMpReturnsApproved_updatesStatusAndCallsBackend() throws Exception {
        Contribution c = contributionWithStatus("PENDING", 1L);
        c.setAmount(new BigDecimal("200"));
        c.setIdCampaign(10L);
        when(contributionRepository.findById(1L)).thenReturn(Optional.of(c));
        when(backendClient.getCampaignTitle(10L)).thenReturn("Campaña Solar");
        when(backendClient.getUsername(1L)).thenReturn("mateo");

        Payment mockPayment = mock(Payment.class);
        when(mockPayment.getStatus()).thenReturn("approved");
        when(mockPayment.getId()).thenReturn(111L);
        when(mercadoPagoGateway.create(any(PaymentCreateRequest.class))).thenReturn(mockPayment);
        when(ledgerClient.registerContributionTransaction(eq("mateo"), any(), anyString())).thenReturn("0xabc123");

        ContributionStatusResponse response = service.process(1L, 1L, buildRequest());

        assertThat(response.getStatus()).isEqualTo("APPROVED");
        assertThat(response.getTransaction().getHashTx()).isEqualTo("0xabc123");
        verify(backendClient).updateCampaignAmount(eq(10L), eq(new BigDecimal("200")));
        verify(contributionRepository, atLeastOnce()).save(argThat(con -> "APPROVED".equals(con.getStatus())));
    }

    @Test
    void process_whenMpReturnsRejected_updatesStatusAndDoesNotCallBackend() throws Exception {
        Contribution c = contributionWithStatus("PENDING", 1L);
        c.setAmount(new BigDecimal("100"));
        c.setIdCampaign(10L);
        when(contributionRepository.findById(1L)).thenReturn(Optional.of(c));

        Payment mockPayment = mock(Payment.class);
        when(mockPayment.getStatus()).thenReturn("rejected");
        when(mockPayment.getId()).thenReturn(222L);
        when(mercadoPagoGateway.create(any())).thenReturn(mockPayment);

        ContributionStatusResponse response = service.process(1L, 1L, buildRequest());

        assertThat(response.getStatus()).isEqualTo("REJECTED");
        assertThat(response.getTransaction().getHashTx()).isNull();
        verify(backendClient, never()).updateCampaignAmount(any(), any());
        verify(ledgerClient, never()).registerContributionTransaction(anyString(), any(), anyString());
    }

    @Test
    void process_whenMPApiExceptionThrown_setsRejected() throws Exception {
        Contribution c = contributionWithStatus("PENDING", 1L);
        when(contributionRepository.findById(1L)).thenReturn(Optional.of(c));

        MPApiException apiEx = mock(MPApiException.class);
        when(apiEx.getStatusCode()).thenReturn(400);
        var apiResponse = mock(com.mercadopago.net.MPResponse.class);
        when(apiResponse.getContent()).thenReturn("bad request");
        when(apiEx.getApiResponse()).thenReturn(apiResponse);
        when(mercadoPagoGateway.create(any())).thenThrow(apiEx);

        // process() atrapa los errores del proveedor y responde REJECTED en vez de
        // relanzar, para que el frontend reciba un estado prolijo y no un 500.
        ContributionStatusResponse response = service.process(1L, 1L, buildRequest());

        assertThat(response.getStatus()).isEqualTo("REJECTED");
        verify(contributionRepository, atLeastOnce()).save(argThat(con -> "REJECTED".equals(con.getStatus())));
    }

    @Test
    void process_whenMPExceptionThrown_setsRejected() throws Exception {
        Contribution c = contributionWithStatus("PENDING", 1L);
        when(contributionRepository.findById(1L)).thenReturn(Optional.of(c));
        when(mercadoPagoGateway.create(any())).thenThrow(new MPException("network error"));

        ContributionStatusResponse response = service.process(1L, 1L, buildRequest());

        assertThat(response.getStatus()).isEqualTo("REJECTED");
        verify(contributionRepository, atLeastOnce()).save(argThat(con -> "REJECTED".equals(con.getStatus())));
    }

    // --- getStatus ---

    @Test
    void getStatus_whenUserDoesNotOwnContribution_throwsSecurityException() {
        Contribution c = contributionWithStatus("APPROVED", 1L);
        when(contributionRepository.findById(1L)).thenReturn(Optional.of(c));

        assertThatThrownBy(() -> service.getStatus(1L, 999L))
                .isInstanceOf(SecurityException.class);
    }

    // --- helpers ---

    private Contribution contributionWithStatus(String status, Long userId) {
        Contribution c = new Contribution();
        ReflectionTestUtils.setField(c, "id", 1L);
        ReflectionTestUtils.setField(c, "createdAt", LocalDateTime.now());
        c.setIdUser(userId);
        c.setIdCampaign(10L);
        c.setAmount(new BigDecimal("100"));
        c.setStatus(status);
        return c;
    }

    private ProcessContributionRequest buildRequest() {
        ProcessContributionRequest req = new ProcessContributionRequest();
        req.setToken("tok");
        req.setPaymentMethodId("visa");
        req.setInstallments(1);
        req.setPayerEmail("test@test.com");
        req.setIdentificationType("DNI");
        req.setIdentificationNumber("12345678");
        return req;
    }
}
