package com.hornero.service;

import com.hornero.dto.AdminUserListResponse;
import com.hornero.dto.AdminUserResponse;
import com.hornero.dto.UpdateProfileRequest;
import com.hornero.model.Role;
import com.hornero.model.User;
import com.hornero.repository.RoleRepository;
import com.hornero.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RoleRepository roleRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailVerificationService emailVerificationService;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private AppImageService appImageService;


    @Transactional
    public User createUser(User user) {        
        // Validar que no exista el email
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("El email ya está registrado");
        }
        
        // Validar que no exista el username
        if (user.getUserName() != null && userRepository.existsByUserName(user.getUserName())) {
            throw new RuntimeException("El username ya está en uso");
        }
        
        // Set userName from username if not set (for compatibility)
        if (user.getUserName() == null && user.getUsername() != null) {
            user.setUserName(user.getUsername());
        }
        
        // Assign CONTRIBUTOR role (id=3) to new users
        Role contributorRole = roleRepository.findById(3L)
                .orElseThrow(() -> new RuntimeException("Role CONTRIBUTOR not found"));
        user.setRole(contributorRole);
        
        // Hash password before saving
        String hashedPassword = passwordEncoder.encode(user.getPassword());
        user.setPassword(hashedPassword);

        // Set email as not verified
        user.setEmailVerified(false);

        // Save user
        User savedUser = userRepository.save(user);

        // Create and send email verification token
        emailVerificationService.createEmailVerificationToken(savedUser);
        
        return savedUser;
    }
    
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public AdminUserListResponse listUsers(int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> users = userRepository.findAll(pageable);

        AdminUserListResponse response = new AdminUserListResponse();
        response.setItems(users.getContent().stream().map(AdminUserResponse::fromEntity).toList());
        response.setTotalUsers(userRepository.count());
        response.setTotalAdmins(userRepository.countByRole_Name("ADMIN"));
        response.setTotalBlocked(userRepository.countByEnabledFalse());
        response.setPage(users.getNumber());
        response.setSize(users.getSize());
        response.setTotalPages(users.getTotalPages());
        return response;
    }
    
    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }
    
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User saveUser(User user) {
        return userRepository.save(user);
    }
    
    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUserName(username);
    }
    
    public User updateUser(Long id, User userDetails) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        // Actualizar campos
        if (userDetails.getFirstName() != null) {
            user.setFirstName(userDetails.getFirstName());
        }
        if (userDetails.getLastName() != null) {
            user.setLastName(userDetails.getLastName());
        }
        if (userDetails.getBio() != null) {
            user.setBio(userDetails.getBio());
        }
        
        return userRepository.save(user);
    }
    
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("Usuario no encontrado");
        }
        userRepository.deleteById(id);
    }
    
    public User login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Credenciales inválidas o email no verificado"));
        
        // Check if hashed passwords match
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Credenciales inválidas o email no verificado");
        }
        
        if (!user.getEnabled()) {
            throw new RuntimeException("Usuario deshabilitado");
        }

        // Check if email is verified
        if (user.getEmailVerified() == null || !user.getEmailVerified()) {
            throw new RuntimeException("Por favor verifica tu email antes de iniciar sesión");
        }
        
        return user;
    }

    public Optional<User> getEnabledUserById(Long userId) {
        return userRepository.findById(userId).filter(user -> Boolean.TRUE.equals(user.getEnabled()));
    }

    /**
     * Updates user password. Used for password reset functionality.
     */
    @Transactional
    public void updatePassword(User user, String newPassword) {
        String hashedPassword = passwordEncoder.encode(newPassword);
        user.setPassword(hashedPassword);
        userRepository.save(user);
    }

    /**
     * Update user profile fields (userName, firstName, lastName, gender, phone).
     */
    @Transactional
    public User updateProfile(Long userId, UpdateProfileRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        String previousAvatarKey = user.getAvatarS3Key();

        // Check username uniqueness if changed
        if (req.getUserName() != null && !req.getUserName().isBlank()
                && !req.getUserName().equals(user.getUserName())) {
            if (userRepository.existsByUserName(req.getUserName())) {
                throw new RuntimeException("El nombre de usuario ya está en uso");
            }
            user.setUserName(req.getUserName().trim());
        }

        if (req.getFirstName() != null) {
            user.setFirstName(req.getFirstName());
        }
        if (req.getLastName() != null) {
            user.setLastName(req.getLastName());
        }
        if (req.getGender() != null) {
            user.setGender(req.getGender());
        }
        if (req.getPhone() != null) {
            user.setPhone(req.getPhone());
        }

        if (Boolean.TRUE.equals(req.getRemoveAvatar())) {
            user.setAvatarS3Key(null);
        } else if (req.getAvatarBase64() != null && !req.getAvatarBase64().isBlank()) {
            String nextAvatarKey = appImageService.persistBase64Image("usuarios/user-" + userId, req.getAvatarBase64());
            user.setAvatarS3Key(nextAvatarKey);
        }

        User savedUser = userRepository.save(user);
        String nextAvatarKey = savedUser.getAvatarS3Key();
        if (previousAvatarKey != null && !previousAvatarKey.isBlank()
                && (nextAvatarKey == null || !previousAvatarKey.equals(nextAvatarKey))) {
            appImageService.deleteImage(previousAvatarKey);
        }

        return savedUser;
    }

    /**
     * Change password for the authenticated user after verifying current password.
     */
    @Transactional
    public void changePassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("La contraseña actual es incorrecta");
        }

        if (newPassword == null || newPassword.length() < 6) {
            throw new RuntimeException("La nueva contraseña debe tener al menos 6 caracteres");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    /**
     * Promote a USER to CREATOR role.
     */
    @Transactional
    public User becomeCreator(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        String currentRole = user.getRole() != null ? user.getRole().getName() : null;
        if (!"USER".equals(currentRole)) {
            throw new RuntimeException("Solo los usuarios con rol USER pueden convertirse en creadores");
        }

        Role creatorRole = roleRepository.findByName("CREATOR")
                .orElseThrow(() -> new RuntimeException("Role CREATOR not found"));
        user.setRole(creatorRole);

        return userRepository.save(user);
    }

    @Transactional
    public User promoteToAdmin(Long userId, Long actorUserId) {
        if (userId.equals(actorUserId)) {
            throw new RuntimeException("No podés cambiar tu propio rol desde esta sección");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseThrow(() -> new RuntimeException("Role ADMIN not found"));

        user.setRole(adminRole);
        return userRepository.save(user);
    }

    @Transactional
    public User removeAdmin(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Role contributorRole = roleRepository.findByName("CONTRIBUTOR")
                .orElseThrow(() -> new RuntimeException("Role CONTRIBUTOR not found"));

        user.setRole(contributorRole);
        return userRepository.save(user);
    }

    @Transactional
    public User setUserEnabled(Long userId, boolean enabled, Long actorUserId) {
        if (userId.equals(actorUserId) && !enabled) {
            throw new RuntimeException("No podés bloquear tu propio usuario");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        user.setEnabled(enabled);
        user.setDisabledAt(enabled ? null : LocalDateTime.now());
        User saved = userRepository.save(user);

        if (!enabled) {
            refreshTokenService.revokeAllUserTokens(saved);
        }

        return saved;
    }
}
