package com.hornero.repository;

import com.hornero.model.RefreshToken;
import com.hornero.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    
    Optional<RefreshToken> findByToken(String token);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM RefreshToken rt WHERE rt.user = :user")
    void deleteByUser(User user);
    
    @Modifying
    @Transactional
    @Query("UPDATE RefreshToken rt SET rt.revoked = true WHERE rt.user = :user")
    void revokeAllByUser(User user);
}
