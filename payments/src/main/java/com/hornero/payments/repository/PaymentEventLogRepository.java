package com.hornero.payments.repository;

import com.hornero.payments.model.PaymentEventLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentEventLogRepository extends JpaRepository<PaymentEventLog, Long> {

    List<PaymentEventLog> findByEntityTypeAndEntityIdOrderByCreatedAtAsc(String entityType, Long entityId);
}
