package com.hornero.repository;

import com.hornero.model.EmailVerificationToken;
import com.hornero.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {

    Optional<EmailVerificationToken> findByToken(String token);

    @Modifying
    @Transactional
    @Query("DELETE FROM EmailVerificationToken evt WHERE evt.user.id = :userId")
    void deleteByUserId(Long userId);

    @Modifying
    @Transactional
    @Query("DELETE FROM EmailVerificationToken evt WHERE evt.expiresAt < :now")
    void deleteExpiredTokens(Instant now);
}
