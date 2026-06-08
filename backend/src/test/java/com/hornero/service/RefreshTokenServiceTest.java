package com.hornero.service;

import com.hornero.model.RefreshToken;
import com.hornero.model.User;
import com.hornero.repository.RefreshTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    @Mock RefreshTokenRepository refreshTokenRepository;

    @InjectMocks RefreshTokenService service;

    private User user;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "secret",
                "hornero-secret-key-change-this-in-production-minimum-256-bits-for-security");
        ReflectionTestUtils.setField(service, "refreshTokenExpiration", 604800000L);

        user = new User();
        user.setId(7L);
        user.setEmail("mateo@hornero.com");
    }

    @Test
    void createRefreshToken_revokesPreviousAndSavesNewSignedToken() {
        when(refreshTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        RefreshToken result = service.createRefreshToken(user);

        verify(refreshTokenRepository).revokeAllByUser(user);
        verify(refreshTokenRepository).save(argThat(rt ->
                rt.getUser() == user
                        && rt.getToken() != null && !rt.getToken().isBlank()
                        && !rt.isRevoked()));
        assertThat(result.isExpired()).isFalse();
    }

    @Test
    void verifyExpiration_whenExpired_deletesAndThrows() {
        RefreshToken token = new RefreshToken(user, "tok", Instant.now().minusSeconds(60));

        assertThatThrownBy(() -> service.verifyExpiration(token))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("expired");

        verify(refreshTokenRepository).delete(token);
    }

    @Test
    void verifyExpiration_whenRevoked_deletesAndThrows() {
        RefreshToken token = new RefreshToken(user, "tok", Instant.now().plusSeconds(3600));
        token.setRevoked(true);

        assertThatThrownBy(() -> service.verifyExpiration(token))
                .isInstanceOf(RuntimeException.class);

        verify(refreshTokenRepository).delete(token);
    }

    @Test
    void verifyExpiration_whenValid_returnsSameTokenWithoutDeleting() {
        RefreshToken token = new RefreshToken(user, "tok", Instant.now().plusSeconds(3600));

        RefreshToken result = service.verifyExpiration(token);

        assertThat(result).isSameAs(token);
        verify(refreshTokenRepository, never()).delete(any());
    }

    @Test
    void revokeToken_whenTokenExists_marksRevokedAndSaves() {
        RefreshToken token = new RefreshToken(user, "tok", Instant.now().plusSeconds(3600));
        when(refreshTokenRepository.findByToken("tok")).thenReturn(Optional.of(token));

        service.revokeToken("tok");

        assertThat(token.isRevoked()).isTrue();
        verify(refreshTokenRepository).save(token);
    }

    @Test
    void revokeToken_whenTokenMissing_doesNothing() {
        when(refreshTokenRepository.findByToken("missing")).thenReturn(Optional.empty());

        service.revokeToken("missing");

        verify(refreshTokenRepository, never()).save(any());
    }
}
