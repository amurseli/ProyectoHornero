package com.hornero.service;

import com.hornero.model.User;
import com.hornero.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public User createUser(User user) {
        // Validar email duplicado
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("El email ya está registrado");
        }

        // Validar userName duplicado
        if (userRepository.existsByUserName(user.getUserName())) {
            throw new RuntimeException("El nombre de usuario ya está en uso");
        }

        // Inicializar campos por defecto
        user.setEnabled(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setDisabledAt(null);

        // (más adelante se agregará cifrado de contraseña)
        return userRepository.save(user);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Optional<User> getUserByUserName(String userName) {
        return userRepository.findByUserName(userName);
    }

    public User updateUser(Long id, User userDetails) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Actualizar campos opcionales
        if (userDetails.getFirstName() != null) user.setFirstName(userDetails.getFirstName());
        if (userDetails.getLastName() != null) user.setLastName(userDetails.getLastName());
        if (userDetails.getPhone() != null) user.setPhone(userDetails.getPhone());
        if (userDetails.getGender() != null) user.setGender(userDetails.getGender());
        if (userDetails.getBio() != null) user.setBio(userDetails.getBio());
        if (userDetails.getEmail() != null) user.setEmail(userDetails.getEmail());
        if (userDetails.getUserName() != null) user.setUserName(userDetails.getUserName());
        if (userDetails.getIdRole() != null) user.setIdRole(userDetails.getIdRole());
        if (userDetails.getEnabled() != null) user.setEnabled(userDetails.getEnabled());

        // Si se deshabilita el usuario, registramos fecha
        if (Boolean.FALSE.equals(user.getEnabled())) {
            user.setDisabledAt(LocalDateTime.now());
        }

        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("Usuario no encontrado");
        }
        userRepository.deleteById(id);
    }
}
