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
import java.util.Optional;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final Logger logger = LoggerFactory.getLogger(OAuth2AuthenticationSuccessHandler.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserConnectionRepository userConnectionRepository;

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

    @Autowired
    private FrontendUrlProvider frontendUrlProvider;

    // true en produccion (HTTPS), false en local (http://localhost)
    @Value("${COOKIE_SECURE:false}")
    private boolean cookieSecure;

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
          response.sendRedirect(frontendUrlProvider.getPrimaryFrontendUrl() + "/login?error=no_email");
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
                  .secure(cookieSecure)
                  .path("/")
                  .maxAge(jwtExpiration / 1000)
                  .sameSite("Lax")
                  .build();
          response.addHeader(HttpHeaders.SET_COOKIE, jwtCookie.toString());

          // Set refresh token as HttpOnly cookie (7 days)
          ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", refreshToken.getToken())
                  .httpOnly(true)
                  .secure(cookieSecure)
                  .path("/")
                  .maxAge(refreshTokenExpiration / 1000)
                  .sameSite("Lax")
                  .build();
          response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

          // Redirect to frontend with success
          String targetUrl = UriComponentsBuilder.fromUriString(frontendUrlProvider.getPrimaryFrontendUrl() + "/oauth2/redirect")
                  .queryParam("success", "true")
                  .build()
                  .toUriString();

          getRedirectStrategy().sendRedirect(request, response, targetUrl);

      } catch (Exception e) {
          logger.error("Error during OAuth2 authentication", e);
          response.sendRedirect(frontendUrlProvider.getPrimaryFrontendUrl() + "/login?error=authentication_failed");
      }
    }

    private User findOrCreateUser(String email, String name, String picture, String oauthId, String provider) {
        // 1) Look up by (provider, provider_id) in user_connections — this is the reliable key
        Optional<UserConnection> existingConnection = userConnectionRepository.findByProviderAndProviderId(provider, oauthId);

        if (existingConnection.isPresent()) {
            // User already has this provider linked — update connection info and return user
            UserConnection conn = existingConnection.get();
            conn.setProviderEmail(email);
            conn.setDisplayName(name);
            conn.setProfileImageUrl(picture);
            userConnectionRepository.save(conn);

            // Eagerly load user by ID to avoid LazyInitializationException
            User user = userRepository.findById(conn.getUser().getId())
                    .orElseThrow(() -> new RuntimeException("User not found for connection"));
            user.setEmailVerified(true);
            return userRepository.save(user);
        }

        // 2) No existing connection — try to find user by email (link to existing account)
        Optional<User> userByEmail = userRepository.findByEmail(email);
        if (userByEmail.isPresent()) {
            User user = userByEmail.get();
            user.setEmailVerified(true);
            userRepository.save(user);

            // Create the connection
            UserConnection conn = new UserConnection(user, provider, oauthId, email, name, picture);
            userConnectionRepository.save(conn);

            return user;
        }

        // 3) Completely new user — create user + connection
        User newUser = new User();
        newUser.setEmail(email);
        newUser.setEmailVerified(true);
        newUser.setEnabled(true);

        // Parse name
        if (name != null) {
            String[] nameParts = name.split(" ", 2);
            newUser.setFirstName(nameParts[0]);
            if (nameParts.length > 1) {
                newUser.setLastName(nameParts[1]);
            }
        }

        // Generate unique username from email prefix
        String baseUserName = email.split("@")[0];
        String userName = baseUserName;
        int suffix = 1;
        while (userRepository.existsByUserName(userName)) {
            userName = baseUserName + suffix;
            suffix++;
        }
        newUser.setUserName(userName);

        // Assign default role
        Role userRole = roleRepository.findByName("USER")
                .orElseGet(() -> {
                    Role role = new Role();
                    role.setName("USER");
                    return roleRepository.save(role);
                });
        newUser.setRole(userRole);

        // Generate temporary password
        String temporaryPassword = generateTemporaryPassword();
        newUser.setPassword(passwordEncoder.encode(temporaryPassword));

        User savedUser = userRepository.save(newUser);

        // Create the connection
        UserConnection conn = new UserConnection(savedUser, provider, oauthId, email, name, picture);
        userConnectionRepository.save(conn);

        // Send welcome email with password setup link
        try {
            String resetLink = passwordResetService.createPasswordResetTokenAndGetLink(email);
            if (resetLink != null) {
                emailService.sendOAuthWelcomeEmail(email, savedUser.getFirstName(), temporaryPassword, resetLink);
                logger.info("OAuth welcome email sent to new user: {}", email);
            }
        } catch (Exception e) {
            logger.error("Failed to send welcome email to new OAuth user: {}", email, e);
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
