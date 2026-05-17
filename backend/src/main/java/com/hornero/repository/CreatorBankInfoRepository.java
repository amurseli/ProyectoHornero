package com.hornero.repository;

import com.hornero.model.CreatorBankInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CreatorBankInfoRepository extends JpaRepository<CreatorBankInfo, Long> {
    Optional<CreatorBankInfo> findByUserId(Long userId);
    void deleteByUserId(Long userId);
}
