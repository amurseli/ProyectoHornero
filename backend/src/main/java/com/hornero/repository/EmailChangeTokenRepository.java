package com.hornero.repository;

import com.hornero.model.EmailChangeToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface EmailChangeTokenRepository extends JpaRepository<EmailChangeToken, Long> {

    Optional<EmailChangeToken> findByToken(String token);

    @Modifying
    @Transactional
    @Query("DELETE FROM EmailChangeToken t WHERE t.user.id = :userId")
    void deleteByUserId(Long userId);

    @Modifying
    @Transactional
    @Query("DELETE FROM EmailChangeToken t WHERE t.expiresAt < :now")
    void deleteExpiredTokens(Instant now);
}
