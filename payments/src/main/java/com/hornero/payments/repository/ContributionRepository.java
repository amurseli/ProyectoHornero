package com.hornero.payments.repository;

import com.hornero.payments.model.Contribution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContributionRepository extends JpaRepository<Contribution, Long> {

    List<Contribution> findByIdCampaignAndStatus(Long idCampaign, String status);

    List<Contribution> findByIdUserAndIdCampaign(Long idUser, Long idCampaign);
}
