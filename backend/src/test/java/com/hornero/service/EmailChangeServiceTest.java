package com.hornero.service;

import com.hornero.model.EmailChangeToken;
import com.hornero.model.User;
import com.hornero.repository.EmailChangeTokenRepository;
import com.hornero.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailChangeServiceTest {

    @Mock EmailChangeTokenRepository tokenRepository;
    @Mock UserRepository userRepository;
    @Mock EmailService emailService;

    @InjectMocks EmailChangeService service;

    private User user() {
        User u = new User();
        u.setId(1L);
        u.setEmail("old@hornero.com");
        u.setFirstName("Mateo");
        return u;
    }

    @Test
    void requestEmailChange_whenSameAsCurrent_throws() {
        assertThatThrownBy(() -> service.requestEmailChange(user(), "OLD@hornero.com"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("igual al actual");
    }

    @Test
    void requestEmailChange_whenNewEmailTaken_throws() {
        when(userRepository.existsByEmail("new@hornero.com")).thenReturn(true);

        assertThatThrownBy(() -> service.requestEmailChange(user(), "new@hornero.com"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("ya está registrado");
    }

    @Test
    void requestEmailChange_whenValid_savesTokenSetsPendingAndSendsToNewEmail() {
        ReflectionTestUtils.setField(service, "frontendUrl", "https://app.hornero.com");
        User user = user();
        when(userRepository.existsByEmail("new@hornero.com")).thenReturn(false);

        service.requestEmailChange(user, "new@hornero.com");

        assertThat(user.getPendingEmail()).isEqualTo("new@hornero.com");
        verify(tokenRepository).deleteByUserId(1L);
        verify(tokenRepository).save(any(EmailChangeToken.class));
        verify(userRepository).save(user);
        verify(emailService).sendEmailChangeVerification(eq("new@hornero.com"), eq("Mateo"),
                contains("https://app.hornero.com/confirm-email-change?token="));
    }

    @Test
    void confirmEmailChange_whenTokenMissing_throws() {
        when(tokenRepository.findByToken("bad")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.confirmEmailChange("bad"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("inválido");
    }

    @Test
    void confirmEmailChange_whenExpired_deletesTokenAndThrows() {
        EmailChangeToken token = mock(EmailChangeToken.class);
        when(token.isExpired()).thenReturn(true);
        when(tokenRepository.findByToken("exp")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> service.confirmEmailChange("exp"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("expirado");

        verify(tokenRepository).delete(token);
    }

    @Test
    void confirmEmailChange_whenNewEmailNowTaken_deletesTokenAndThrows() {
        EmailChangeToken token = mock(EmailChangeToken.class);
        when(token.isExpired()).thenReturn(false);
        when(token.getNewEmail()).thenReturn("new@hornero.com");
        when(tokenRepository.findByToken("t")).thenReturn(Optional.of(token));
        when(userRepository.existsByEmail("new@hornero.com")).thenReturn(true);

        assertThatThrownBy(() -> service.confirmEmailChange("t"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("ya está registrado");

        verify(tokenRepository).delete(token);
        verify(userRepository, never()).save(any());
    }

    @Test
    void confirmEmailChange_whenValid_updatesEmailClearsPendingAndDeletesToken() {
        User user = user();
        EmailChangeToken token = mock(EmailChangeToken.class);
        when(token.isExpired()).thenReturn(false);
        when(token.getNewEmail()).thenReturn("new@hornero.com");
        when(token.getUser()).thenReturn(user);
        when(tokenRepository.findByToken("ok")).thenReturn(Optional.of(token));
        when(userRepository.existsByEmail("new@hornero.com")).thenReturn(false);

        User result = service.confirmEmailChange("ok");

        assertThat(result.getEmail()).isEqualTo("new@hornero.com");
        assertThat(result.getPendingEmail()).isNull();
        verify(userRepository).save(user);
        verify(tokenRepository).delete(token);
    }

    @Test
    void cancelEmailChange_clearsPendingAndDeletesTokens() {
        User user = user();
        user.setPendingEmail("new@hornero.com");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        service.cancelEmailChange(1L);

        assertThat(user.getPendingEmail()).isNull();
        verify(tokenRepository).deleteByUserId(1L);
        verify(userRepository).save(user);
    }
}
