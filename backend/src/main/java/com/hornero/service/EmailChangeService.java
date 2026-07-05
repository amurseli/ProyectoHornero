package com.hornero.service;

import com.hornero.config.FrontendUrlProvider;
import com.hornero.model.EmailChangeToken;
import com.hornero.model.User;
import com.hornero.repository.EmailChangeTokenRepository;
import com.hornero.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class EmailChangeService {

    @Autowired
    private EmailChangeTokenRepository emailChangeTokenRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private FrontendUrlProvider frontendUrlProvider;

    /**
     * Initiates an email change request. Sends a verification email to the NEW address.
     * The old email stays active until the new one is confirmed.
     */
    @Transactional
    public void requestEmailChange(User user, String newEmail) {
        // Validate new email is different
        if (newEmail.equalsIgnoreCase(user.getEmail())) {
            throw new RuntimeException("El nuevo email es igual al actual");
        }

        // Check if new email is already taken
        if (userRepository.existsByEmail(newEmail)) {
            throw new RuntimeException("El email ya está registrado por otra cuenta");
        }

        // Delete any existing email change tokens for this user
        emailChangeTokenRepository.deleteByUserId(user.getId());

        // Create new token
        EmailChangeToken token = new EmailChangeToken(user, newEmail);
        emailChangeTokenRepository.save(token);

        // Store pending email on user
        user.setPendingEmail(newEmail);
        userRepository.save(user);

        // Build confirm link
        String confirmLink = frontendUrlProvider.getPrimaryFrontendUrl() + "/confirm-email-change?token=" + token.getToken();

        // Send verification to the NEW email
        emailService.sendEmailChangeVerification(newEmail, user.getFirstName(), confirmLink);
    }

    /**
     * Confirms the email change using the verification token.
     * Updates the user's email and clears the pending email + OAuth link if email changes.
     */
    @Transactional
    public User confirmEmailChange(String tokenValue) {
        Optional<EmailChangeToken> tokenOpt = emailChangeTokenRepository.findByToken(tokenValue);

        if (tokenOpt.isEmpty()) {
            throw new RuntimeException("Token inválido");
        }

        EmailChangeToken token = tokenOpt.get();

        if (token.isExpired()) {
            emailChangeTokenRepository.delete(token);
            throw new RuntimeException("El token ha expirado. Solicitá el cambio de email nuevamente.");
        }

        // Double-check new email isn't taken
        if (userRepository.existsByEmail(token.getNewEmail())) {
            emailChangeTokenRepository.delete(token);
            throw new RuntimeException("El email ya está registrado por otra cuenta");
        }

        User user = token.getUser();

        // Update email
        user.setEmail(token.getNewEmail());
        user.setPendingEmail(null);
        userRepository.save(user);

        // Clean up token
        emailChangeTokenRepository.delete(token);

        return user;
    }

    /**
     * Cancels a pending email change.
     */
    @Transactional
    public void cancelEmailChange(Long userId) {
        emailChangeTokenRepository.deleteByUserId(userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        user.setPendingEmail(null);
        userRepository.save(user);
    }
}
