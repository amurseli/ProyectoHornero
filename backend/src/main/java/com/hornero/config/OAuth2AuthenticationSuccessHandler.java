package com.hornero.config;

import com.hornero.model.RefreshToken;
import com.hornero.model.Role;
import com.hornero.model.User;
import com.hornero.repository.RoleRepository;
import com.hornero.repository.UserRepository;
import com.hornero.service.EmailService;
import com.hornero.service.PasswordResetService;
import com.hornero.service.RefreshTokenService;
import com.hornero.util.JwtUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Optional;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final Logger logger = LoggerFactory.getLogger(OAuth2AuthenticationSuccessHandler.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private PasswordResetService passwordResetService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Value("${jwt.expiration}")
    private Long jwtExpiration;

    @Value("${jwt.refresh.expiration}")
    private Long refreshTokenExpiration;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        // Extract user information from OAuth2User
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");
        String sub = oAuth2User.getAttribute("sub"); // Google's user ID

        if (email == null) {
          response.sendRedirect(frontendUrl + "/login?error=no_email");
          return;
        }

        try {
          // Find or create user
          User user = findOrCreateUser(email, name, picture, sub, "google");

          // Generate JWT token
          String roleName = user.getRole() != null ? user.getRole().getName() : "USER";
          String accessToken = jwtUtil.generateToken(user.getEmail(), user.getId(), roleName);

          // Generate refresh token (7 days) - similar to login endpoint
          RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

          // Set JWT token as HttpOnly cookie (15 min)
          ResponseCookie jwtCookie = ResponseCookie.from("jwt", accessToken)
                  .httpOnly(true)
                  .secure(false) // Set to true in production with HTTPS
                  .path("/")
                  .maxAge(jwtExpiration / 1000)
                  .sameSite("Lax")
                  .build();
          response.addHeader(HttpHeaders.SET_COOKIE, jwtCookie.toString());

          // Set refresh token as HttpOnly cookie (7 days)
          ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", refreshToken.getToken())
                  .httpOnly(true)
                  .secure(false) // Set to true in production with HTTPS
                  .path("/")
                  .maxAge(refreshTokenExpiration / 1000)
                  .sameSite("Lax")
                  .build();
          response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

          // Redirect to frontend with success
          String targetUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/oauth2/redirect")
                  .queryParam("success", "true")
                  .build()
                  .toUriString();

          getRedirectStrategy().sendRedirect(request, response, targetUrl);

      } catch (Exception e) {
          logger.error("Error during OAuth2 authentication", e);
          response.sendRedirect(frontendUrl + "/login?error=authentication_failed");
      }
    }

    private User findOrCreateUser(String email, String name, String picture, String oauthId, String provider) {
        // Try to find user by email and provider
        Optional<User> existingUser = userRepository.findByEmailAndOauthProvider(email, provider);

        if (existingUser.isPresent()) {
          // Update existing user's info
          User user = existingUser.get();
          user.setOauthId(oauthId);
          user.setProfileImageUrl(picture);
          user.setEmailVerified(true);
          return userRepository.save(user);
        }

        // Try to find user by email only (might be registered with password before)
        Optional<User> userByEmail = userRepository.findByEmail(email);
        if (userByEmail.isPresent()) {
          // Link OAuth to existing account
          User user = userByEmail.get();
          user.setOauthProvider(provider);
          user.setOauthId(oauthId);
          user.setProfileImageUrl(picture);
          user.setEmailVerified(true);
          return userRepository.save(user);
        }

        // Create new user with temporary password
        User newUser = new User();
        newUser.setEmail(email);
        newUser.setOauthProvider(provider);
        newUser.setOauthId(oauthId);
        newUser.setProfileImageUrl(picture);
        newUser.setEmailVerified(true);
        newUser.setEnabled(true);

        // Parse name (simple approach)
        if (name != null) {
          String[] nameParts = name.split(" ", 2);
          newUser.setFirstName(nameParts[0]);
          if (nameParts.length > 1) {
            newUser.setLastName(nameParts[1]);
          }
          // Generate username from email
          newUser.setUserName(email.split("@")[0]);
        }

        // Assign default role (USER)
        Role userRole = roleRepository.findByName("USER")
                .orElseGet(() -> {
                    Role role = new Role();
                    role.setName("USER");
                    return roleRepository.save(role);
                });
        newUser.setRole(userRole);

        // Generate temporary password for OAuth users
        String temporaryPassword = generateTemporaryPassword();
        newUser.setPassword(passwordEncoder.encode(temporaryPassword));

        // Save user first
        User savedUser = userRepository.save(newUser);

        // Send welcome email with password setup link asynchronously
        try {
            // Create password reset token and get the link
            String resetLink = passwordResetService.createPasswordResetTokenAndGetLink(email);

            if (resetLink != null) {
                // Send welcome email with the temporary password and reset link
                emailService.sendOAuthWelcomeEmail(email, savedUser.getFirstName(), temporaryPassword, resetLink);
                logger.info("OAuth welcome email sent to new user: {}", email);
            }
        } catch (Exception e) {
            logger.error("Failed to send welcome email to new OAuth user: {}", email, e);
            // Don't fail the authentication if email sending fails
        }

        return savedUser;
    }

    /**
     * Generates a random temporary password for OAuth users
     */
    private String generateTemporaryPassword() {
        return java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }
}
