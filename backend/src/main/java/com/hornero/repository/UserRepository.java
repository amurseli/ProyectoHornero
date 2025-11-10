package com.hornero.repository;

import com.hornero.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Buscar por email
    Optional<User> findByEmail(String email);

    // Buscar por nombre de usuario
    Optional<User> findByUserName(String userName);

    // Verificar si existe un email registrado
    boolean existsByEmail(String email);

    // Verificar si existe un nombre de usuario registrado
    boolean existsByUserName(String userName);
}
