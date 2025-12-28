package com.hornero.controller;

import com.hornero.dto.AuthResponse;
import com.hornero.dto.ErrorResponse;
import com.hornero.dto.LoginRequest;
import com.hornero.dto.RegisterRequest;
import com.hornero.model.User;
import com.hornero.service.UserService;
import com.hornero.util.JwtUtil;
import jakarta.servlet.http.Cookie;
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
    
    @Value("${jwt.expiration}")
    private Long jwtExpiration;
    
    // GET /api/users - Obtener todos los usuarios
    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
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
            
            // Generate JWT token
            String roleName = newUser.getRole() != null ? newUser.getRole().getName() : "USER";
            String token = jwtUtil.generateToken(newUser.getEmail(), newUser.getId(), roleName);
            
            // Set JWT as HttpOnly cookie
            Cookie jwtCookie = new Cookie("jwt", token);
            jwtCookie.setHttpOnly(true);
            jwtCookie.setSecure(false); // Set to true in production with HTTPS
            jwtCookie.setPath("/");
            jwtCookie.setMaxAge((int) (jwtExpiration / 1000)); // Convert milliseconds to seconds
            response.addCookie(jwtCookie);
            
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
    
    // POST /api/users/login - Login endpoint with JWT
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest, HttpServletResponse response) {
        try {
            User user = userService.login(loginRequest.getEmail(), loginRequest.getPassword());
            
            // Generate JWT token
            String roleName = user.getRole() != null ? user.getRole().getName() : "USER";
            String token = jwtUtil.generateToken(user.getEmail(), user.getId(), roleName);
            
            // Set JWT as HttpOnly cookie
            Cookie jwtCookie = new Cookie("jwt", token);
            jwtCookie.setHttpOnly(true);
            jwtCookie.setSecure(false); // Set to true in production with HTTPS
            jwtCookie.setPath("/");
            jwtCookie.setMaxAge((int) (jwtExpiration / 1000)); // Convert milliseconds to seconds
            response.addCookie(jwtCookie);
            
            // Create response without token (user info only)
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
    
    // POST /api/users/logout - Logout endpoint
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        // Clear JWT cookie
        Cookie jwtCookie = new Cookie("jwt", null);
        jwtCookie.setHttpOnly(true);
        jwtCookie.setSecure(false);
        jwtCookie.setPath("/");
        jwtCookie.setMaxAge(0); // Delete cookie
        response.addCookie(jwtCookie);
        
        return ResponseEntity.ok().body("Logged out successfully");
    }
}