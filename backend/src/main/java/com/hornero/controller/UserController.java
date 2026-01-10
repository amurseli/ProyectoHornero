package com.hornero.controller;

import com.hornero.dto.AuthResponse;
import com.hornero.dto.ErrorResponse;
import com.hornero.dto.LoginRequest;
import com.hornero.dto.RegisterRequest;
import com.hornero.model.RefreshToken;
import com.hornero.model.User;
import com.hornero.service.RefreshTokenService;
import com.hornero.service.UserService;
import com.hornero.util.JwtUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @Autowired
    private RefreshTokenService refreshTokenService;
    
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
    
    // POST /api/users/register - Register new user with JWT
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody com.hornero.dto.RegisterRequest request, HttpServletResponse response) {
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
            
            // Generate JWT access token (15 min)
            String roleName = newUser.getRole() != null ? newUser.getRole().getName() : "USER";
            String accessToken = jwtUtil.generateToken(newUser.getEmail(), newUser.getId(), roleName);
            
            // Generate refresh token (7 days)
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(newUser);
            
            // Determine refresh token cookie maxAge based on remember flag
            Boolean remember = request.getRemember();
            int refreshTokenMaxAge;
            
            if (remember != null && remember) {
                // Remember me: persist refresh token for 7 days
                refreshTokenMaxAge = (int) (refreshTokenExpiration / 1000);
            } else {
                // Don't remember: session cookie
                refreshTokenMaxAge = -1;
            }
            
            // Set JWT access token as HttpOnly cookie (always 15 min)
            Cookie jwtCookie = new Cookie("jwt", accessToken);
            jwtCookie.setHttpOnly(true);
            jwtCookie.setSecure(false); // Set to true in production with HTTPS
            jwtCookie.setPath("/");
            jwtCookie.setMaxAge((int) (jwtExpiration / 1000)); // Always 15 min
            response.addCookie(jwtCookie);
            
            // Set refresh token as HttpOnly cookie
            Cookie refreshCookie = new Cookie("refreshToken", refreshToken.getToken());
            refreshCookie.setHttpOnly(true);
            refreshCookie.setSecure(false); // Set to true in production with HTTPS
            refreshCookie.setPath("/");
            refreshCookie.setMaxAge(refreshTokenMaxAge);
            response.addCookie(refreshCookie);
            
            // Create response without token (user info only)
            AuthResponse authResponse = new AuthResponse(
                null, // No token in response body
                newUser.getId(),
                newUser.getEmail(),
                newUser.getUsername(),
                newUser.getFirstName(),
                roleName
            );
            
            return ResponseEntity.status(HttpStatus.CREATED).body(authResponse);
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
            Cookie jwtCookie = new Cookie("jwt", accessToken);
            jwtCookie.setHttpOnly(true);
            jwtCookie.setSecure(false); // Set to true in production with HTTPS
            jwtCookie.setPath("/");
            jwtCookie.setMaxAge((int) (jwtExpiration / 1000)); // Always 15 min
            response.addCookie(jwtCookie);
            
            // Set refresh token as HttpOnly cookie
            Cookie refreshCookie = new Cookie("refreshToken", refreshToken.getToken());
            refreshCookie.setHttpOnly(true);
            refreshCookie.setSecure(false); // Set to true in production with HTTPS
            refreshCookie.setPath("/");
            refreshCookie.setMaxAge(refreshTokenMaxAge);
            response.addCookie(refreshCookie);
            
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
        Cookie jwtCookie = new Cookie("jwt", null);
        jwtCookie.setHttpOnly(true);
        jwtCookie.setSecure(false);
        jwtCookie.setPath("/");
        jwtCookie.setMaxAge(0);
        response.addCookie(jwtCookie);
        
        // Clear refresh token cookie
        Cookie refreshCookie = new Cookie("refreshToken", null);
        refreshCookie.setHttpOnly(true);
        refreshCookie.setSecure(false);
        refreshCookie.setPath("/");
        refreshCookie.setMaxAge(0);
        response.addCookie(refreshCookie);
        
        return ResponseEntity.ok().body("Logged out successfully");
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