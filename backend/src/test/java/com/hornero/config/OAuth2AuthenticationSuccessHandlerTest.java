package com.hornero.config;

import com.hornero.model.RefreshToken;
import com.hornero.model.Role;
import com.hornero.model.User;
import com.hornero.model.UserConnection;
import com.hornero.repository.RoleRepository;
import com.hornero.repository.UserConnectionRepository;
import com.hornero.repository.UserRepository;
import com.hornero.service.EmailService;
import com.hornero.service.PasswordResetService;
import com.hornero.service.RefreshTokenService;
import com.hornero.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OAuth2AuthenticationSuccessHandlerTest {

    @Mock UserRepository userRepository;
    @Mock UserConnectionRepository userConnectionRepository;
    @Mock RoleRepository roleRepository;
    @Mock RefreshTokenService refreshTokenService;
    @Mock PasswordResetService passwordResetService;
    @Mock EmailService emailService;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtUtil jwtUtil;
    @Mock FrontendUrlProvider frontendUrlProvider;

    @Mock HttpServletRequest request;
    @Mock HttpServletResponse response;
    @Mock Authentication authentication;
    @Mock OAuth2User oAuth2User;

    @InjectMocks OAuth2AuthenticationSuccessHandler handler;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(handler, "jwtExpiration", 900000L);
        ReflectionTestUtils.setField(handler, "refreshTokenExpiration", 604800000L);
        when(frontendUrlProvider.getFrontendUrl()).thenReturn("https://app.hornero.com");
    }

    private void stubGoogleAttributes(String email) {
        when(oAuth2User.getAttribute("email")).thenReturn(email);
        when(oAuth2User.getAttribute("name")).thenReturn("Mateo Fernández");
        when(oAuth2User.getAttribute("picture")).thenReturn("https://pic");
        when(oAuth2User.getAttribute("sub")).thenReturn("google-sub-1");
        when(authentication.getPrincipal()).thenReturn(oAuth2User);
    }

    private void stubTokenIssuance(User user) {
        when(jwtUtil.generateToken(any(), any(), any())).thenReturn("jwt-access");
        when(refreshTokenService.createRefreshToken(any()))
                .thenReturn(new RefreshToken(user, "refresh-token", Instant.now().plusSeconds(3600)));
    }

    @Test
    void onAuthenticationSuccess_whenNoEmail_redirectsToLoginError() throws Exception {
        when(oAuth2User.getAttribute("email")).thenReturn(null);
        when(authentication.getPrincipal()).thenReturn(oAuth2User);

        handler.onAuthenticationSuccess(request, response, authentication);

        verify(response).sendRedirect("https://app.hornero.com/login?error=no_email");
        verifyNoInteractions(userRepository);
    }

    @Test
    void onAuthenticationSuccess_whenConnectionExists_updatesItAndMarksEmailVerified() throws Exception {
        stubGoogleAttributes("user@hornero.com");
        User user = new User();
        user.setId(5L);
        UserConnection conn = new UserConnection(user, "google", "google-sub-1",
                "user@hornero.com", "Mateo", "https://pic");
        when(userConnectionRepository.findByProviderAndProviderId("google", "google-sub-1"))
                .thenReturn(Optional.of(conn));
        when(userRepository.findById(5L)).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        stubTokenIssuance(user);

        handler.onAuthenticationSuccess(request, response, authentication);

        verify(userConnectionRepository).save(conn);
        verify(userRepository).save(user);
        org.assertj.core.api.Assertions.assertThat(user.getEmailVerified()).isTrue();
        verify(response, atLeastOnce()).addHeader(eq("Set-Cookie"), anyString());
    }

    @Test
    void onAuthenticationSuccess_whenFrontendUrlHasMultipleOrigins_usesPrimaryOriginForRedirect() throws Exception {
        stubGoogleAttributes("user@hornero.com");
        User user = new User();
        user.setId(5L);
        UserConnection conn = new UserConnection(user, "google", "google-sub-1",
                "user@hornero.com", "Mateo", "https://pic");
        when(userConnectionRepository.findByProviderAndProviderId("google", "google-sub-1"))
                .thenReturn(Optional.of(conn));
        when(userRepository.findById(5L)).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        stubTokenIssuance(user);
        when(frontendUrlProvider.getFrontendUrl())
                .thenReturn("https://proyecto-hornero.com");

        handler.onAuthenticationSuccess(request, response, authentication);

        verify(response).sendRedirect("https://proyecto-hornero.com/oauth2/redirect?success=true");
    }

    @Test
    void onAuthenticationSuccess_whenUserExistsByEmailWithoutConnection_linksConnection() throws Exception {
        stubGoogleAttributes("existing@hornero.com");
        User existing = new User();
        existing.setId(8L);
        when(userConnectionRepository.findByProviderAndProviderId("google", "google-sub-1"))
                .thenReturn(Optional.empty());
        when(userRepository.findByEmail("existing@hornero.com")).thenReturn(Optional.of(existing));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        stubTokenIssuance(existing);

        handler.onAuthenticationSuccess(request, response, authentication);

        // Links a new connection to the pre-existing local account and marks it verified...
        org.assertj.core.api.Assertions.assertThat(existing.getEmailVerified()).isTrue();
        verify(userConnectionRepository).save(any(UserConnection.class));
        // ...without creating a fresh user or sending the new-user welcome email.
        verify(userRepository, never()).existsByUserName(any());
        verify(emailService, never()).sendOAuthWelcomeEmail(any(), any(), any(), any());
    }

    @Test
    void onAuthenticationSuccess_whenNewUser_createsUserConnectionAndSendsWelcomeEmail() throws Exception {
        stubGoogleAttributes("brandnew@hornero.com");
        when(userConnectionRepository.findByProviderAndProviderId("google", "google-sub-1"))
                .thenReturn(Optional.empty());
        when(userRepository.findByEmail("brandnew@hornero.com")).thenReturn(Optional.empty());
        when(userRepository.existsByUserName("brandnew")).thenReturn(false);
        when(roleRepository.findByName("USER")).thenReturn(Optional.of(new Role()));
        when(passwordEncoder.encode(any())).thenReturn("hashed-temp");
        when(userRepository.save(any())).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(99L);
            return u;
        });
        when(passwordResetService.createPasswordResetTokenAndGetLink("brandnew@hornero.com"))
                .thenReturn("https://app.hornero.com/reset-password?token=abc");
        stubTokenIssuance(new User());

        handler.onAuthenticationSuccess(request, response, authentication);

        verify(userRepository).save(argThat(u ->
                "brandnew".equals(u.getUserName())
                        && Boolean.TRUE.equals(u.getEmailVerified())
                        && "Mateo".equals(u.getFirstName())));
        verify(userConnectionRepository).save(any(UserConnection.class));
        verify(emailService).sendOAuthWelcomeEmail(eq("brandnew@hornero.com"), any(), any(), any());
    }
}
