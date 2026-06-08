package com.hornero.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock JavaMailSender mailSender;

    @InjectMocks EmailService service;

    @Test
    void sendPasswordResetEmail_buildsMessageWithRecipientSubjectAndLink() {
        ReflectionTestUtils.setField(service, "fromEmail", "noreply@hornero.com");

        service.sendPasswordResetEmail("user@hornero.com", "Mateo", "https://app/reset?token=abc");

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        SimpleMailMessage sent = captor.getValue();
        assertThat(sent.getFrom()).isEqualTo("noreply@hornero.com");
        assertThat(sent.getTo()).containsExactly("user@hornero.com");
        assertThat(sent.getSubject()).contains("Recuperación de contraseña");
        assertThat(sent.getText()).contains("Mateo").contains("https://app/reset?token=abc");
    }

    @Test
    void sendEmailVerificationEmail_includesVerificationLink() {
        ReflectionTestUtils.setField(service, "fromEmail", "noreply@hornero.com");

        service.sendEmailVerificationEmail("user@hornero.com", "Mateo", "https://app/verify?token=xyz");

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        assertThat(captor.getValue().getText()).contains("https://app/verify?token=xyz");
    }

    @Test
    void sendOAuthWelcomeEmail_includesTemporaryPassword() {
        ReflectionTestUtils.setField(service, "fromEmail", "noreply@hornero.com");

        service.sendOAuthWelcomeEmail("user@hornero.com", "Mateo", "temp-pass-123", "https://app/reset?token=abc");

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        assertThat(captor.getValue().getText()).contains("temp-pass-123");
    }

    @Test
    void sendPasswordResetEmail_whenSenderFails_wrapsInRuntimeException() {
        ReflectionTestUtils.setField(service, "fromEmail", "noreply@hornero.com");
        doThrow(new MailSendException("smtp down")).when(mailSender).send(any(SimpleMailMessage.class));

        assertThatThrownBy(() ->
                service.sendPasswordResetEmail("user@hornero.com", "Mateo", "https://app/reset"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("correo de recuperación");
    }

    @Test
    void sendEmailChangeVerification_sendsToNewAddressWithConfirmLink() {
        ReflectionTestUtils.setField(service, "fromEmail", "noreply@hornero.com");

        service.sendEmailChangeVerification("new@hornero.com", "Mateo", "https://app/confirm?token=t");

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        SimpleMailMessage sent = captor.getValue();
        assertThat(sent.getTo()).containsExactly("new@hornero.com");
        assertThat(sent.getSubject()).contains("nuevo email");
        assertThat(sent.getText()).contains("https://app/confirm?token=t");
    }

    @Test
    void emailBody_usesFallbackNameWhenFirstNameMissing() {
        ReflectionTestUtils.setField(service, "fromEmail", "noreply@hornero.com");

        service.sendEmailVerificationEmail("user@hornero.com", null, "https://app/verify");

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        assertThat(captor.getValue().getText()).contains("Usuario");
    }
}
