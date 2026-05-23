package com.hornero.payments.service;

import com.hornero.payments.client.BackendClient;
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
    @Mock PaymentEventLogService paymentEventLogService;

    @InjectMocks PayoutService service;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "platformRate", new BigDecimal("0.05"));
        ReflectionTestUtils.setField(service, "providerRate", new BigDecimal("0.0299"));
    }

    @Test
    void executePayout_whenPayoutAlreadyExists_throwsIllegalState() {
        when(payoutRepository.existsByIdCampaign(1L)).thenReturn(true);

        assertThatThrownBy(() -> service.executePayout(1L, 10L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Ya existe");
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
        when(payoutRepository.save(any())).thenAnswer(inv -> {
            Payout p = inv.getArgument(0);
            ReflectionTestUtils.setField(p, "id", 1L);
            return p;
        });

        PayoutStatusResponse response = service.executePayout(1L, 10L);

        // gross=1000, platform=50.00 (5%), provider=29.90 (2.99%), net=920.10
        assertThat(response.getGrossAmount()).isEqualByComparingTo("1000");
        assertThat(response.getPlatformFee()).isEqualByComparingTo("50.00");
        assertThat(response.getProviderFee()).isEqualByComparingTo("29.90");
        assertThat(response.getNetAmount()).isEqualByComparingTo("920.10");
    }

    @Test
    void executePayout_happyPath_savesPayoutWithProcessingStatus() {
        when(payoutRepository.existsByIdCampaign(1L)).thenReturn(false);
        when(backendClient.getCreatorPayoutCbu(10L)).thenReturn("0000000000000000000000");
        when(contributionRepository.findByIdCampaignAndStatus(1L, "APPROVED"))
                .thenReturn(List.of(contribution(new BigDecimal("500"))));
        when(payoutRepository.save(any())).thenAnswer(inv -> {
            Payout p = inv.getArgument(0);
            ReflectionTestUtils.setField(p, "id", 1L);
            return p;
        });

        PayoutStatusResponse response = service.executePayout(1L, 10L);

        assertThat(response.getStatus()).isEqualTo("PROCESSING");
    }

    private Contribution contribution(BigDecimal amount) {
        Contribution c = new Contribution();
        c.setIdCampaign(1L);
        c.setAmount(amount);
        c.setStatus("APPROVED");
        return c;
    }
}
