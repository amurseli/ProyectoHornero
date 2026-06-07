package com.hornero.service;

import com.hornero.dto.UpdateProfileRequest;
import com.hornero.model.Role;
import com.hornero.model.User;
import com.hornero.repository.RoleRepository;
import com.hornero.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock UserRepository userRepository;
    @Mock RoleRepository roleRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock EmailVerificationService emailVerificationService;
    @Mock RefreshTokenService refreshTokenService;
    @Mock AppImageService appImageService;

    @InjectMocks UserService service;

    private User userWithRole(String roleName) {
        User user = new User();
        user.setId(1L);
        Role role = new Role();
        role.setName(roleName);
        user.setRole(role);
        return user;
    }

    // --- createUser ---

    @Test
    void createUser_whenEmailExists_throws() {
        User user = new User();
        user.setEmail("taken@hornero.com");
        when(userRepository.existsByEmail("taken@hornero.com")).thenReturn(true);

        assertThatThrownBy(() -> service.createUser(user))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("email ya está registrado");
    }

    @Test
    void createUser_whenUsernameExists_throws() {
        User user = new User();
        user.setEmail("new@hornero.com");
        user.setUserName("tomado");
        when(userRepository.existsByEmail("new@hornero.com")).thenReturn(false);
        when(userRepository.existsByUserName("tomado")).thenReturn(true);

        assertThatThrownBy(() -> service.createUser(user))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("username ya está en uso");

        verify(userRepository, never()).save(any());
    }

    @Test
    void createUser_whenValid_assignsContributorRoleHashesPasswordAndSendsVerification() {
        User user = new User();
        user.setEmail("new@hornero.com");
        user.setUserName("nuevo");
        user.setPassword("plain");
        when(userRepository.existsByEmail("new@hornero.com")).thenReturn(false);
        when(userRepository.existsByUserName("nuevo")).thenReturn(false);
        Role contributor = new Role();
        when(roleRepository.findById(3L)).thenReturn(Optional.of(contributor));
        when(passwordEncoder.encode("plain")).thenReturn("hashed");
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        User result = service.createUser(user);

        assertThat(result.getRole()).isSameAs(contributor);
        assertThat(result.getPassword()).isEqualTo("hashed");
        assertThat(result.getEmailVerified()).isFalse();
        verify(emailVerificationService).createEmailVerificationToken(result);
    }

    // --- login ---

    @Test
    void login_whenUserMissing_throws() {
        when(userRepository.findByEmail("x@h.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.login("x@h.com", "pw"))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void login_whenPasswordWrong_throws() {
        User user = new User();
        user.setPassword("hashed");
        when(userRepository.findByEmail("x@h.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("pw", "hashed")).thenReturn(false);

        assertThatThrownBy(() -> service.login("x@h.com", "pw"))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void login_whenEmailNotVerified_throws() {
        User user = new User();
        user.setPassword("hashed");
        user.setEnabled(true);
        user.setEmailVerified(false);
        when(userRepository.findByEmail("x@h.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("pw", "hashed")).thenReturn(true);

        assertThatThrownBy(() -> service.login("x@h.com", "pw"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("verifica tu email");
    }

    @Test
    void login_whenValid_returnsUser() {
        User user = new User();
        user.setPassword("hashed");
        user.setEnabled(true);
        user.setEmailVerified(true);
        when(userRepository.findByEmail("x@h.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("pw", "hashed")).thenReturn(true);

        assertThat(service.login("x@h.com", "pw")).isSameAs(user);
    }

    // --- changePassword ---

    @Test
    void changePassword_whenCurrentWrong_throws() {
        User user = new User();
        user.setPassword("hashed");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        assertThatThrownBy(() -> service.changePassword(1L, "wrong", "newpass"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("actual es incorrecta");
    }

    @Test
    void changePassword_whenNewTooShort_throws() {
        User user = new User();
        user.setPassword("hashed");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("current", "hashed")).thenReturn(true);

        assertThatThrownBy(() -> service.changePassword(1L, "current", "123"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("al menos 6");
    }

    @Test
    void changePassword_whenValid_encodesAndSaves() {
        User user = new User();
        user.setPassword("hashed");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("current", "hashed")).thenReturn(true);
        when(passwordEncoder.encode("newsecret")).thenReturn("newhash");

        service.changePassword(1L, "current", "newsecret");

        assertThat(user.getPassword()).isEqualTo("newhash");
        verify(userRepository).save(user);
    }

    // --- becomeCreator ---

    @Test
    void becomeCreator_whenNotUserRole_throws() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(userWithRole("CONTRIBUTOR")));

        assertThatThrownBy(() -> service.becomeCreator(1L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("rol USER");
    }

    @Test
    void becomeCreator_whenUserRole_promotesToCreator() {
        User user = userWithRole("USER");
        Role creator = new Role();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(roleRepository.findByName("CREATOR")).thenReturn(Optional.of(creator));
        when(userRepository.save(user)).thenReturn(user);

        User result = service.becomeCreator(1L);

        assertThat(result.getRole()).isSameAs(creator);
    }

    // --- promoteToAdmin ---

    @Test
    void promoteToAdmin_whenActingOnSelf_throws() {
        assertThatThrownBy(() -> service.promoteToAdmin(1L, 1L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("tu propio rol");

        verifyNoInteractions(userRepository);
    }

    @Test
    void promoteToAdmin_whenValid_setsAdminRole() {
        User user = new User();
        Role admin = new Role();
        when(userRepository.findById(2L)).thenReturn(Optional.of(user));
        when(roleRepository.findByName("ADMIN")).thenReturn(Optional.of(admin));
        when(userRepository.save(user)).thenReturn(user);

        User result = service.promoteToAdmin(2L, 1L);

        assertThat(result.getRole()).isSameAs(admin);
    }

    // --- setUserEnabled ---

    @Test
    void setUserEnabled_whenDisablingSelf_throws() {
        assertThatThrownBy(() -> service.setUserEnabled(1L, false, 1L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("tu propio usuario");
    }

    @Test
    void setUserEnabled_whenDisabling_revokesRefreshTokens() {
        User user = new User();
        when(userRepository.findById(2L)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        service.setUserEnabled(2L, false, 1L);

        assertThat(user.getEnabled()).isFalse();
        verify(refreshTokenService).revokeAllUserTokens(user);
    }

    @Test
    void setUserEnabled_whenEnabling_doesNotRevokeTokens() {
        User user = new User();
        when(userRepository.findById(2L)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        service.setUserEnabled(2L, true, 1L);

        assertThat(user.getEnabled()).isTrue();
        verify(refreshTokenService, never()).revokeAllUserTokens(any());
    }

    // --- removeAdmin ---

    @Test
    void removeAdmin_setsContributorRole() {
        User user = new User();
        Role contributor = new Role();
        when(userRepository.findById(2L)).thenReturn(Optional.of(user));
        when(roleRepository.findByName("CONTRIBUTOR")).thenReturn(Optional.of(contributor));
        when(userRepository.save(user)).thenReturn(user);

        User result = service.removeAdmin(2L);

        assertThat(result.getRole()).isSameAs(contributor);
    }

    // --- updatePassword ---

    @Test
    void updatePassword_encodesAndSaves() {
        User user = new User();
        when(passwordEncoder.encode("newsecret")).thenReturn("newhash");

        service.updatePassword(user, "newsecret");

        assertThat(user.getPassword()).isEqualTo("newhash");
        verify(userRepository).save(user);
    }

    // --- updateProfile ---

    @Test
    void updateProfile_whenUsernameTaken_throws() {
        User user = new User();
        user.setUserName("actual");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.existsByUserName("nuevo")).thenReturn(true);

        UpdateProfileRequest req = new UpdateProfileRequest();
        req.setUserName("nuevo");

        assertThatThrownBy(() -> service.updateProfile(1L, req))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("ya está en uso");

        verify(userRepository, never()).save(any());
    }

    @Test
    void updateProfile_whenValid_updatesFieldsAndRemovesAvatar() {
        User user = new User();
        user.setAvatarS3Key("old-avatar.png");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        UpdateProfileRequest req = new UpdateProfileRequest();
        req.setFirstName("Mateo");
        req.setLastName("Fernández");
        req.setRemoveAvatar(true);

        User result = service.updateProfile(1L, req);

        assertThat(result.getFirstName()).isEqualTo("Mateo");
        assertThat(result.getLastName()).isEqualTo("Fernández");
        assertThat(result.getAvatarS3Key()).isNull();
        // Orphaned avatar object is cleaned up from storage.
        verify(appImageService).deleteImage("old-avatar.png");
    }

    // --- deleteUser ---

    @Test
    void deleteUser_whenMissing_throws() {
        when(userRepository.existsById(9L)).thenReturn(false);

        assertThatThrownBy(() -> service.deleteUser(9L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("no encontrado");

        verify(userRepository, never()).deleteById(any());
    }
}
