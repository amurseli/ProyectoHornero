package com.hornero.service;

import com.hornero.model.EmailVerificationToken;
import com.hornero.model.User;
import com.hornero.repository.EmailVerificationTokenRepository;
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
class EmailVerificationServiceTest {

    @Mock EmailVerificationTokenRepository tokenRepository;
    @Mock UserRepository userRepository;
    @Mock EmailService emailService;

    @InjectMocks EmailVerificationService service;

    private User user() {
        User u = new User();
        u.setEmail("user@hornero.com");
        u.setFirstName("Mateo");
        return u;
    }

    @Test
    void createEmailVerificationToken_savesTokenAndSendsEmailWithLink() {
        ReflectionTestUtils.setField(service, "frontendUrl", "https://app.hornero.com");

        service.createEmailVerificationToken(user());

        verify(tokenRepository).save(any(EmailVerificationToken.class));
        verify(emailService).sendEmailVerificationEmail(eq("user@hornero.com"), eq("Mateo"),
                contains("https://app.hornero.com/verify-email?token="));
    }

    @Test
    void verifyEmail_whenTokenMissing_throws() {
        when(tokenRepository.findByToken("bad")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.verifyEmail("bad"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("inválido");
    }

    @Test
    void verifyEmail_whenTokenExpired_throws() {
        EmailVerificationToken token = mock(EmailVerificationToken.class);
        when(token.isExpired()).thenReturn(true);
        when(tokenRepository.findByToken("exp")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> service.verifyEmail("exp"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("expirado");

        verify(userRepository, never()).save(any());
    }

    @Test
    void verifyEmail_whenValid_marksVerifiedAndDeletesToken() {
        User user = user();
        EmailVerificationToken token = mock(EmailVerificationToken.class);
        when(token.isExpired()).thenReturn(false);
        when(token.getUser()).thenReturn(user);
        when(tokenRepository.findByToken("ok")).thenReturn(Optional.of(token));

        User result = service.verifyEmail("ok");

        assertThat(result.getEmailVerified()).isTrue();
        verify(userRepository).save(user);
        verify(tokenRepository).delete(token);
    }

    @Test
    void resendVerificationEmail_whenAlreadyVerified_throws() {
        User user = user();
        user.setEmailVerified(true);

        assertThatThrownBy(() -> service.resendVerificationEmail(user))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("ya está verificado");

        verifyNoInteractions(tokenRepository);
    }

    @Test
    void resendVerificationEmail_whenNotVerified_createsNewToken() {
        ReflectionTestUtils.setField(service, "frontendUrl", "https://app.hornero.com");
        User user = user();
        user.setEmailVerified(false);

        service.resendVerificationEmail(user);

        verify(tokenRepository).save(any(EmailVerificationToken.class));
        verify(emailService).sendEmailVerificationEmail(eq("user@hornero.com"), any(), any());
    }
}
