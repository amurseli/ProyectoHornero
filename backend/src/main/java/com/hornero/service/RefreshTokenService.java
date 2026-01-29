package com.hornero.service;

import com.hornero.model.RefreshToken;
import com.hornero.model.User;
import com.hornero.repository.RefreshTokenRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class RefreshTokenService {

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Value("${jwt.secret:hornero-secret-key-change-this-in-production-minimum-256-bits}")
    private String secret;

    @Value("${jwt.refresh.expiration:604800000}") // 7 days in milliseconds
    private Long refreshTokenExpiration;

    private SecretKey getSigningKey() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public RefreshToken createRefreshToken(User user) {
        // Revoke all previous refresh tokens for this user
        revokeAllUserTokens(user);
        
        // Generate new refresh token as JWT
        String token = generateJwtRefreshToken(user);
        Instant expiryDate = Instant.now().plusMillis(refreshTokenExpiration);
        
        RefreshToken refreshToken = new RefreshToken(user, token, expiryDate);
        return refreshTokenRepository.save(refreshToken);
    }

    private String generateJwtRefreshToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("type", "refresh");
        
        Date now = new Date();
        Date expirationDate = new Date(now.getTime() + refreshTokenExpiration);

        return Jwts.builder()
                .claims(claims)
                .subject(user.getEmail())
                .issuedAt(now)
                .expiration(expirationDate)
                .signWith(getSigningKey())
                .compact();
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
