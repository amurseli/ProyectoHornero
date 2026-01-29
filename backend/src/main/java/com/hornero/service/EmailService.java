package com.hornero.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    
    @Autowired
    private JavaMailSender mailSender;
    
    @Value("${spring.mail.from:noreply@proyectohornero.com}")
    private String fromEmail;
    
    /**
     * Sends a password reset email to the user.
     * 
     * @param email The recipient's email address
     * @param firstName The user's first name for personalization
     * @param resetLink The password reset link containing the token
     */
    public void sendPasswordResetEmail(String email, String firstName, String resetLink) {
        try {
            String subject = "Recuperación de contraseña - Proyecto Hornero";
            String body = buildPasswordResetEmailBody(firstName, resetLink);
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(email);
            message.setSubject(subject);
            message.setText(body);
            
            mailSender.send(message);
            
            logger.info("Password reset email sent successfully to: {}", email);
        } catch (Exception e) {
            logger.error("Failed to send password reset email to: {}", email, e);
            throw new RuntimeException("Error al enviar el correo de recuperación", e);
        }
    }
    
    private String buildPasswordResetEmailBody(String firstName, String resetLink) {
        String name = (firstName != null && !firstName.isEmpty()) ? firstName : "Usuario";
        
        return String.format(
            """
            Hola %s,
            
            Recibimos una solicitud para restablecer tu contraseña en Proyecto Hornero.
            
            Para crear una nueva contraseña, haz clic en el siguiente enlace:
            %s
            
            Este enlace expirará en 1 hora por motivos de seguridad.
            
            Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura.
            
            Saludos,
            El equipo de Proyecto Hornero
            """,
            name,
            resetLink
        );
    }
    
    /**
     * Sends a welcome email to new OAuth users with password setup instructions.
     * 
     * @param email The recipient's email address
     * @param firstName The user's first name for personalization
     * @param temporaryPassword The temporary password created for the user
     * @param resetLink The password setup link containing the token
     */
    public void sendOAuthWelcomeEmail(String email, String firstName, String temporaryPassword, String resetLink) {
        try {
            String subject = "Bienvenido a Proyecto Hornero";
            String body = buildOAuthWelcomeEmailBody(firstName, temporaryPassword, resetLink);
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(email);
            message.setSubject(subject);
            message.setText(body);
            
            mailSender.send(message);
            
            logger.info("OAuth welcome email sent successfully to: {}", email);
        } catch (Exception e) {
            logger.error("Failed to send OAuth welcome email to: {}", email, e);
            throw new RuntimeException("Error al enviar el correo de bienvenida", e);
        }
    }
    
    private String buildOAuthWelcomeEmailBody(String firstName, String temporaryPassword, String resetLink) {
        String name = (firstName != null && !firstName.isEmpty()) ? firstName : "Usuario";
        
        return String.format(
            """
            ¡Hola %s!
            
            Bienvenido a Proyecto Hornero. Has iniciado sesión con tu cuenta de Google.
            
            Por tu seguridad, hemos creado una contraseña temporal para tu cuenta:
            
            Contraseña temporal: %s
            
            Te recomendamos establecer una contraseña personalizada para que también puedas 
            iniciar sesión directamente con tu email.
            
            Para cambiar tu contraseña, haz clic en el siguiente enlace:
            %s
            
            Este enlace expirará en 1 hora por motivos de seguridad.
            
            Nota: Puedes seguir usando Google para iniciar sesión sin necesidad de una contraseña.
            
            ¡Gracias por unirte a nosotros!
            
            Saludos,
            El equipo de Proyecto Hornero
            """,
            name,
            temporaryPassword,
            resetLink
        );
    }
    
    /**
     * Sends an email verification link to the user.
     * 
     * @param email The recipient's email address
     * @param firstName The user's first name for personalization
     * @param verificationLink The email verification link containing the token
     */
    public void sendEmailVerificationEmail(String email, String firstName, String verificationLink) {
        try {
            String subject = "Verifica tu email - Proyecto Hornero";
            String body = buildEmailVerificationBody(firstName, verificationLink);
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(email);
            message.setSubject(subject);
            message.setText(body);
            
            mailSender.send(message);
            
            logger.info("Email verification sent successfully to: {}", email);
        } catch (Exception e) {
            logger.error("Failed to send email verification to: {}", email, e);
            throw new RuntimeException("Error al enviar el correo de verificación", e);
        }
    }
    
    private String buildEmailVerificationBody(String firstName, String verificationLink) {
        String name = (firstName != null && !firstName.isEmpty()) ? firstName : "Usuario";
        
        return String.format(
            """
            ¡Hola %s!
            
            Gracias por registrarte en Proyecto Hornero.
            
            Para completar tu registro y verificar tu cuenta, haz clic en el siguiente enlace:
            %s
            
            Este enlace expirará en 24 horas por motivos de seguridad.
            
            Si no te registraste en Proyecto Hornero, puedes ignorar este correo de forma segura.
            
            Saludos,
            El equipo de Proyecto Hornero
            """,
            name,
            verificationLink
        );
    }
}
