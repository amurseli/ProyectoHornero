package com.hornero.controller;

import com.hornero.dto.AuthResponse;
import com.hornero.dto.ErrorResponse;
import com.hornero.dto.ForgotPasswordRequest;
import com.hornero.dto.LoginRequest;
import com.hornero.dto.RegisterRequest;
import com.hornero.dto.ResetPasswordRequest;
import com.hornero.model.RefreshToken;
import com.hornero.model.User;
import com.hornero.service.EmailVerificationService;
import com.hornero.service.PasswordResetService;
import com.hornero.service.RefreshTokenService;
import com.hornero.service.UserService;
import com.hornero.util.JwtUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private PasswordResetService passwordResetService;

    @Autowired
    private EmailVerificationService emailVerificationService;
    
    @Value("${jwt.expiration}")
    private Long jwtExpiration;

    @Value("${jwt.refresh.expiration}")
    private Long refreshTokenExpiration;
    
    // GET /api/users - Obtener todos los usuarios
    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    // GET /api/users/me - Get current user from JWT cookie
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(HttpServletRequest request) {
        try {
            // User info is already extracted by JwtAuthenticationFilter
            Long userId = (Long) request.getAttribute("userId");
            String email = (String) request.getAttribute("userEmail");
            String role = (String) request.getAttribute("userRole");

            if (userId == null || email == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ErrorResponse("Not authenticated", HttpStatus.UNAUTHORIZED.value()));
            }

            // Get full user details from database
            User user = userService.getUserById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Create response with user info
            AuthResponse authResponse = new AuthResponse(
                null, // No token in response body
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getFirstName(),
                role
            );

            return ResponseEntity.ok(authResponse);
        } catch (Exception e) {
            System.out.println("DEBUG /me - Exception: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Not authenticated", HttpStatus.UNAUTHORIZED.value()));
        }
    }
    
    // GET /api/users/{id} - Obtener usuario por ID
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userService.getUserById(id)
                .map(user -> ResponseEntity.ok(user))
                .orElse(ResponseEntity.notFound().build());
    }
    
    // POST /api/users/register - Register new user and send verification email
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody com.hornero.dto.RegisterRequest request) {
        try {
            // Create User from RegisterRequest
            User user = new User();
            user.setUserName(request.getUserName());
            user.setFirstName(request.getFirstName());
            user.setLastName(request.getLastName());
            user.setEmail(request.getEmail());
            user.setPassword(request.getPassword());
            user.setEnabled(request.getEnabled() != null ? request.getEnabled() : true);
            
            User newUser = userService.createUser(user);

            // Return success message indicating email was sent
            Map<String, String> response = new HashMap<>();
            response.put("message", "Registro exitoso. Por favor verifica tu email para activar tu cuenta.");
            response.put("email", newUser.getEmail());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }
    
    // POST /api/users - Crear nuevo usuario (legacy endpoint)
    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        try {
            User newUser = userService.createUser(user);
            return ResponseEntity.status(HttpStatus.CREATED).body(newUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // PUT /api/users/{id} - Actualizar usuario
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User userDetails) {
        try {
            User updatedUser = userService.updateUser(id, userDetails);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    // DELETE /api/users/{id} - Eliminar usuario
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    // GET /api/users/email/{email} - Buscar por email
    @GetMapping("/email/{email}")
    public ResponseEntity<User> getUserByEmail(@PathVariable String email) {
        return userService.getUserByEmail(email)
                .map(user -> ResponseEntity.ok(user))
                .orElse(ResponseEntity.notFound().build());
    }
    
    // GET /api/users/username/{username} - Buscar por username
    @GetMapping("/username/{username}")
    public ResponseEntity<User> getUserByUsername(@PathVariable String username) {
        return userService.getUserByUsername(username)
                .map(user -> ResponseEntity.ok(user))
                .orElse(ResponseEntity.notFound().build());
    }
    
    // POST /api/users/login - Login endpoint with JWT and refresh token
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest, HttpServletResponse response) {
        try {
            User user = userService.login(loginRequest.getEmail(), loginRequest.getPassword());
            
            // Generate JWT access token (15 min)
            String roleName = user.getRole() != null ? user.getRole().getName() : "USER";
            String accessToken = jwtUtil.generateToken(user.getEmail(), user.getId(), roleName);

            // Generate refresh token (7 days)
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

            // Determine refresh token cookie maxAge based on remember flag
            Boolean remember = loginRequest.getRemember();
            int refreshTokenMaxAge;

            if (remember != null && remember) {
                // Remember me: persist refresh token for 7 days
                refreshTokenMaxAge = (int) (refreshTokenExpiration / 1000);
            } else {
                // Don't remember: session cookie (expire when browser closes)
                refreshTokenMaxAge = -1;
            }
            
            // Set JWT access token as HttpOnly cookie (always 15 min)
            ResponseCookie jwtCookie = ResponseCookie.from("jwt", accessToken)
                    .httpOnly(true)
                    .secure(false) // Set to true in production with HTTPS
                    .path("/")
                    .maxAge(jwtExpiration / 1000) // Always 15 min
                    .sameSite("Lax")
                    .build();
            response.addHeader(HttpHeaders.SET_COOKIE, jwtCookie.toString());

            // Set refresh token as HttpOnly cookie
            ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", refreshToken.getToken())
                    .httpOnly(true)
                    .secure(false) // Set to true in production with HTTPS
                    .path("/")
                    .maxAge(refreshTokenMaxAge)
                    .sameSite("Lax")
                    .build();
            response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
            
            // Create response without tokens (user info only)
            AuthResponse authResponse = new AuthResponse(
                null, // No token in response body
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getFirstName(),
                roleName
            );
            
            return ResponseEntity.ok(authResponse);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse(e.getMessage(), HttpStatus.UNAUTHORIZED.value()));
        }
    }
    
    // POST /api/users/logout - Logout endpoint with refresh token revocation
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        try {
            // Extract refresh token from cookie and revoke it
            String refreshTokenValue = getRefreshTokenFromCookie(request);
            if (refreshTokenValue != null) {
                refreshTokenService.revokeToken(refreshTokenValue);
            }

            // Extract user ID from JWT to revoke all tokens (optional - more secure)
            Long userId = (Long) request.getAttribute("userId");
            if (userId != null) {
                userService.getUserById(userId).ifPresent(user ->
                    refreshTokenService.revokeAllUserTokens(user)
                );
            }
        } catch (Exception e) {
            // Log error but continue with logout
            System.err.println("Error revoking refresh token: " + e.getMessage());
        }

        // Clear JWT access token cookie
        ResponseCookie jwtCookie = ResponseCookie.from("jwt", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, jwtCookie.toString());

        // Clear refresh token cookie
        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
        
        return ResponseEntity.ok().body("Logged out successfully");
    }

    // POST /api/users/forgot-password - Request password reset
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            // Create password reset token and send email
            // Note: We don't reveal whether the email exists for security reasons
            passwordResetService.createPasswordResetToken(request.getEmail());

            // Always return success, even if email doesn't exist
            Map<String, String> response = new HashMap<>();
            response.put("message", "Si el email existe en nuestro sistema, recibirás un correo con instrucciones para restablecer tu contraseña");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // Log the error but still return success to avoid revealing information
            System.err.println("Error in forgot-password endpoint: " + e.getMessage());
            e.printStackTrace();

            Map<String, String> response = new HashMap<>();
            response.put("message", "Si el email existe en nuestro sistema, recibirás un correo con instrucciones para restablecer tu contraseña");

            return ResponseEntity.ok(response);
        }
    }

    // POST /api/users/reset-password - Reset password using token
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            // Validate token and get user
            User user = passwordResetService.resetPassword(request.getToken(), request.getNewPassword());

            // Update password
            userService.updatePassword(user, request.getNewPassword());

            // Invalidate all refresh tokens for this user (logout from all devices)
            refreshTokenService.revokeAllUserTokens(user);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Tu contraseña ha sido actualizada exitosamente");

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        } catch (Exception e) {
            System.err.println("Error in reset-password endpoint: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error al restablecer la contraseña", HttpStatus.INTERNAL_SERVER_ERROR.value()));
        }
    }

    // GET /api/users/verify-email - Verify email using token
    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam String token) {
        try {
            // Validate token and mark email as verified
            User user = emailVerificationService.verifyEmail(token);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Email verificado exitosamente");
            response.put("email", user.getEmail());
            response.put("verified", true);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        } catch (Exception e) {
            System.err.println("Error in verify-email endpoint: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Error al verificar el email", HttpStatus.INTERNAL_SERVER_ERROR.value()));
        }
    }

    /**
     * Extract refresh token from cookies
     */
    private String getRefreshTokenFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("refreshToken".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}