package com.hornero.payments.repository;

import com.hornero.payments.model.FeeConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FeeConfigRepository extends JpaRepository<FeeConfig, Long> {

    Optional<FeeConfig> findTopByOrderByIdDesc();
}
