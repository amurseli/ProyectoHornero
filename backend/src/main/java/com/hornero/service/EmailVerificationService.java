package com.hornero.service;

import com.hornero.config.FrontendUrlProvider;
import com.hornero.model.EmailVerificationToken;
import com.hornero.model.User;
import com.hornero.repository.EmailVerificationTokenRepository;
import com.hornero.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Service
public class EmailVerificationService {

    @Autowired
    private EmailVerificationTokenRepository emailVerificationTokenRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private FrontendUrlProvider frontendUrlProvider;

    /**
     * Creates an email verification token for a user and sends verification email.
     *
     * @param user The user who needs email verification
     */
    @Transactional
    public void createEmailVerificationToken(User user) {
        // Create new token
        EmailVerificationToken verificationToken = new EmailVerificationToken(user);
        emailVerificationTokenRepository.save(verificationToken);

        // Build verification link
        String verificationLink = frontendUrlProvider.getFrontendUrl() + "/verify-email?token=" + verificationToken.getToken();

        // Send verification email
        emailService.sendEmailVerificationEmail(user.getEmail(), user.getFirstName(), verificationLink);
    }

    /**
     * Validates a verification token and marks the user's email as verified.
     *
     * @param token The email verification token
     * @return The user whose email was verified
     * @throws RuntimeException if token is invalid or expired
     */
    @Transactional
    public User verifyEmail(String token) {
        // Find token
        Optional<EmailVerificationToken> tokenOpt = emailVerificationTokenRepository.findByToken(token);

        if (tokenOpt.isEmpty()) {
            throw new RuntimeException("Token inválido");
        }

        EmailVerificationToken verificationToken = tokenOpt.get();

        // Check if token is expired
        if (verificationToken.isExpired()) {
            throw new RuntimeException("Token expirado");
        }

        User user = verificationToken.getUser();

        // Mark email as verified
        user.setEmailVerified(true);
        userRepository.save(user);

        // Delete token after successful verification
        emailVerificationTokenRepository.delete(verificationToken);

        return user;
    }

    /**
     * Cleanup expired tokens (should be run periodically).
     */
    @Transactional
    public void cleanupExpiredTokens() {
        emailVerificationTokenRepository.deleteExpiredTokens(Instant.now());
    }

    /**
     * Resends verification email to a user if their email is not verified.
     *
     * @param user The user who needs a new verification email
     * @throws RuntimeException if email is already verified
     */
    @Transactional
    public void resendVerificationEmail(User user) {
        if (user.getEmailVerified() != null && user.getEmailVerified()) {
            throw new RuntimeException("El email ya está verificado");
        }

        createEmailVerificationToken(user);
    }
}
