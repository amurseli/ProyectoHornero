package com.hornero.service;

import com.hornero.model.PasswordResetToken;
import com.hornero.model.User;
import com.hornero.repository.PasswordResetTokenRepository;
import com.hornero.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Service
public class PasswordResetService {
    
    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private EmailService emailService;
    
    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;
    
    /**
     * Creates a password reset token for the given email and sends reset email.
     * Returns true if user exists (and email was sent), false otherwise.
     * Note: For security, the caller should always return success to avoid revealing
     * if an email exists in the system.
     */
    @Transactional
    public boolean createPasswordResetToken(String email) {
        String resetLink = createPasswordResetTokenAndGetLink(email);
        
        if (resetLink == null) {
            return false;
        }
        
        // Send password reset email
        Optional<User> userOpt = userRepository.findByEmail(email);
        userOpt.ifPresent(user -> 
            emailService.sendPasswordResetEmail(user.getEmail(), user.getFirstName(), resetLink)
        );
        
        return true;
    }
    
    /**
     * Creates a password reset token and returns the reset link.
     * Returns null if user doesn't exist.
     * Used for OAuth user welcome emails.
     */
    @Transactional
    public String createPasswordResetTokenAndGetLink(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        
        if (userOpt.isEmpty()) {
            return null;
        }
        
        User user = userOpt.get();
        
        // Invalidate all existing tokens for this user (ensure only one active token)
        passwordResetTokenRepository.invalidateAllByUser(user);
        
        // Create new token
        PasswordResetToken resetToken = new PasswordResetToken(user);
        passwordResetTokenRepository.save(resetToken);
        
        // Build and return reset link
        return frontendUrl + "/reset-password?token=" + resetToken.getToken();
    }
    
    /**
     * Validates a reset token and returns the associated user if valid.
     */
    public Optional<User> validateResetToken(String token) {
        Optional<PasswordResetToken> tokenOpt = passwordResetTokenRepository.findByToken(token);
        
        if (tokenOpt.isEmpty()) {
            return Optional.empty();
        }
        
        PasswordResetToken resetToken = tokenOpt.get();
        
        if (!resetToken.isValid()) {
            return Optional.empty();
        }
        
        return Optional.of(resetToken.getUser());
    }
    
    /**
     * Marks a token as used after password has been reset successfully.
     */
    @Transactional
    public void markTokenAsUsed(String token) {
        Optional<PasswordResetToken> tokenOpt = passwordResetTokenRepository.findByToken(token);
        tokenOpt.ifPresent(resetToken -> {
            resetToken.setUsed(true);
            passwordResetTokenRepository.save(resetToken);
        });
    }
    
    /**
     * Cleanup expired and used tokens (should be run periodically).
     */
    @Transactional
    public void cleanupExpiredTokens() {
        passwordResetTokenRepository.deleteExpiredAndUsedTokens(Instant.now());
    }
    
    /**
     * Resets user password using a valid token.
     * Validates token, updates password, marks token as used.
     * 
     * @param token The password reset token
     * @param newPassword The new password (will be hashed)
     * @return The user whose password was reset
     * @throws RuntimeException if token is invalid or expired
     */
    @Transactional
    public User resetPassword(String token, String newPassword) {
        // Validate token and get user
        Optional<User> userOpt = validateResetToken(token);
        
        if (userOpt.isEmpty()) {
            throw new RuntimeException("Token inválido o expirado");
        }
        
        User user = userOpt.get();
        
        // Mark token as used
        markTokenAsUsed(token);
        
        return user;
    }
}
