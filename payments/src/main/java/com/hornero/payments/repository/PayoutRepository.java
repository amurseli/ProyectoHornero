package com.hornero.payments.repository;

import com.hornero.payments.model.Payout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PayoutRepository extends JpaRepository<Payout, Long> {

    Optional<Payout> findByIdCampaign(Long idCampaign);

    boolean existsByIdCampaign(Long idCampaign);
}
