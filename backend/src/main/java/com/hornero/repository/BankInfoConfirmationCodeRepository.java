package com.hornero.repository;

import com.hornero.model.BankInfoConfirmationCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface BankInfoConfirmationCodeRepository extends JpaRepository<BankInfoConfirmationCode, Long> {

    Optional<BankInfoConfirmationCode> findTopByUserIdAndUsedFalseOrderByIdDesc(Long userId);

    @Modifying
    @Transactional
    @Query("DELETE FROM BankInfoConfirmationCode c WHERE c.user.id = :userId")
    void deleteByUserId(Long userId);
}
