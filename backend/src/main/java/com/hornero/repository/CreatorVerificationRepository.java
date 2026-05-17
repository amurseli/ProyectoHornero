package com.hornero.repository;

import com.hornero.model.CreatorVerification;
import com.hornero.model.CreatorVerification.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CreatorVerificationRepository extends JpaRepository<CreatorVerification, Long> {
    Optional<CreatorVerification> findByUserId(Long userId);
    List<CreatorVerification> findByVerificationStatus(VerificationStatus status);
    boolean existsByUserId(Long userId);
}
