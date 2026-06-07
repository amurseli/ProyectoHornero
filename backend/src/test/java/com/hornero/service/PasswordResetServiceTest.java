package com.hornero.service;

import com.hornero.model.PasswordResetToken;
import com.hornero.model.User;
import com.hornero.repository.PasswordResetTokenRepository;
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
class PasswordResetServiceTest {

    @Mock PasswordResetTokenRepository tokenRepository;
    @Mock UserRepository userRepository;
    @Mock EmailService emailService;

    @InjectMocks PasswordResetService service;

    private User user() {
        User u = new User();
        u.setEmail("user@hornero.com");
        u.setFirstName("Mateo");
        return u;
    }

    @Test
    void createPasswordResetToken_whenUserMissing_returnsFalseAndSendsNothing() {
        when(userRepository.findByEmail("ghost@hornero.com")).thenReturn(Optional.empty());

        boolean result = service.createPasswordResetToken("ghost@hornero.com");

        assertThat(result).isFalse();
        verifyNoInteractions(emailService);
    }

    @Test
    void createPasswordResetToken_whenUserExists_invalidatesOldTokensAndSendsEmail() {
        ReflectionTestUtils.setField(service, "frontendUrl", "https://app.hornero.com");
        User user = user();
        when(userRepository.findByEmail("user@hornero.com")).thenReturn(Optional.of(user));

        boolean result = service.createPasswordResetToken("user@hornero.com");

        assertThat(result).isTrue();
        verify(tokenRepository).invalidateAllByUser(user);
        verify(tokenRepository).save(any(PasswordResetToken.class));
        verify(emailService).sendPasswordResetEmail(eq("user@hornero.com"), eq("Mateo"),
                contains("https://app.hornero.com/reset-password?token="));
    }

    @Test
    void validateResetToken_whenInvalid_returnsEmpty() {
        PasswordResetToken token = mock(PasswordResetToken.class);
        when(token.isValid()).thenReturn(false);
        when(tokenRepository.findByToken("t")).thenReturn(Optional.of(token));

        assertThat(service.validateResetToken("t")).isEmpty();
    }

    @Test
    void validateResetToken_whenValid_returnsUser() {
        User user = user();
        PasswordResetToken token = mock(PasswordResetToken.class);
        when(token.isValid()).thenReturn(true);
        when(token.getUser()).thenReturn(user);
        when(tokenRepository.findByToken("t")).thenReturn(Optional.of(token));

        assertThat(service.validateResetToken("t")).contains(user);
    }

    @Test
    void resetPassword_whenTokenInvalid_throws() {
        when(tokenRepository.findByToken("bad")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.resetPassword("bad", "newpass"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("inválido o expirado");
    }

    @Test
    void resetPassword_whenValid_marksTokenUsedAndReturnsUser() {
        User user = user();
        PasswordResetToken token = mock(PasswordResetToken.class);
        when(token.isValid()).thenReturn(true);
        when(token.getUser()).thenReturn(user);
        when(tokenRepository.findByToken("ok")).thenReturn(Optional.of(token));

        User result = service.resetPassword("ok", "newpass");

        assertThat(result).isSameAs(user);
        verify(token).setUsed(true);
        verify(tokenRepository).save(token);
    }

    @Test
    void markTokenAsUsed_whenMissing_doesNothing() {
        when(tokenRepository.findByToken("none")).thenReturn(Optional.empty());

        service.markTokenAsUsed("none");

        verify(tokenRepository, never()).save(any());
    }
}
