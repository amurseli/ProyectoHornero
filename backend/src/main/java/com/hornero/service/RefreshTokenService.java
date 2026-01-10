package com.hornero.service;

import com.hornero.model.RefreshToken;
import com.hornero.model.User;
import com.hornero.repository.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class RefreshTokenService {

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Value("${jwt.refresh.expiration:604800000}") // 7 days in milliseconds
    private Long refreshTokenExpiration;

    public RefreshToken createRefreshToken(User user) {
        // Revoke all previous refresh tokens for this user
        revokeAllUserTokens(user);
        
        // Generate new refresh token
        String token = UUID.randomUUID().toString();
        Instant expiryDate = Instant.now().plusMillis(refreshTokenExpiration);
        
        RefreshToken refreshToken = new RefreshToken(user, token, expiryDate);
        return refreshTokenRepository.save(refreshToken);
    }

    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.isExpired() || token.isRevoked()) {
            refreshTokenRepository.delete(token);
            throw new RuntimeException("Refresh token expired or revoked. Please login again.");
        }
        return token;
    }

    @Transactional
    public void revokeAllUserTokens(User user) {
        refreshTokenRepository.revokeAllByUser(user);
    }

    @Transactional
    public void deleteByUser(User user) {
        refreshTokenRepository.deleteByUser(user);
    }

    @Transactional
    public void revokeToken(String token) {
        Optional<RefreshToken> refreshToken = refreshTokenRepository.findByToken(token);
        refreshToken.ifPresent(rt -> {
            rt.setRevoked(true);
            refreshTokenRepository.save(rt);
        });
    }
}
