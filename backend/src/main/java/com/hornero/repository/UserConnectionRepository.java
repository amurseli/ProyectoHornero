package com.hornero.repository;

import com.hornero.model.UserConnection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserConnectionRepository extends JpaRepository<UserConnection, Long> {

    @Query("SELECT uc FROM UserConnection uc WHERE uc.provider = :provider AND uc.providerId = :providerId")
    Optional<UserConnection> findByProviderAndProviderId(@Param("provider") String provider,
                                                         @Param("providerId") String providerId);

    @Query("SELECT uc FROM UserConnection uc WHERE uc.user.id = :userId")
    List<UserConnection> findByUserId(@Param("userId") Long userId);

    @Query("SELECT uc FROM UserConnection uc WHERE uc.user.id = :userId AND uc.provider = :provider")
    Optional<UserConnection> findByUserIdAndProvider(@Param("userId") Long userId,
                                                      @Param("provider") String provider);

    @Query("SELECT uc FROM UserConnection uc JOIN FETCH uc.user u WHERE u.id IN :userIds ORDER BY u.id ASC, uc.id ASC")
    List<UserConnection> findByUserIdInOrderByUserIdAscIdAsc(@Param("userIds") Collection<Long> userIds);

    @Modifying
    @Transactional
    @Query("DELETE FROM UserConnection uc WHERE uc.user.id = :userId AND uc.provider = :provider")
    void deleteByUserIdAndProvider(@Param("userId") Long userId, @Param("provider") String provider);
}
