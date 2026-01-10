package com.hornero.controller;

import com.hornero.dto.AuthResponse;
import com.hornero.dto.ErrorResponse;
import com.hornero.model.RefreshToken;
import com.hornero.model.User;
import com.hornero.service.RefreshTokenService;
import com.hornero.util.JwtUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private JwtUtil jwtUtil;

    @Value("${jwt.expiration}")
    private Long jwtExpiration;

    /**
     * Refresh access token using refresh token from cookie
     * POST /api/auth/refresh
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(HttpServletRequest request, HttpServletResponse response) {
        try {
            // Extract refresh token from cookie
            String refreshTokenValue = getRefreshTokenFromCookie(request);
            
            if (refreshTokenValue == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ErrorResponse("Refresh token not found", HttpStatus.UNAUTHORIZED.value()));
            }

            // Validate refresh token
            RefreshToken refreshToken = refreshTokenService.findByToken(refreshTokenValue)
                    .orElseThrow(() -> new RuntimeException("Invalid refresh token"));

            refreshToken = refreshTokenService.verifyExpiration(refreshToken);

            // Get user from refresh token
            User user = refreshToken.getUser();
            String roleName = user.getRole() != null ? user.getRole().getName() : "USER";

            // Generate new access token
            String newAccessToken = jwtUtil.generateToken(user.getEmail(), user.getId(), roleName);

            // Set new access token as HttpOnly cookie (15 min)
            Cookie jwtCookie = new Cookie("jwt", newAccessToken);
            jwtCookie.setHttpOnly(true);
            jwtCookie.setSecure(false); // Set to true in production with HTTPS
            jwtCookie.setPath("/");
            jwtCookie.setMaxAge((int) (jwtExpiration / 1000));
            response.addCookie(jwtCookie);

            // Return user info
            AuthResponse authResponse = new AuthResponse(
                null,
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getFirstName(),
                roleName
            );

            return ResponseEntity.ok(authResponse);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse(e.getMessage(), HttpStatus.UNAUTHORIZED.value()));
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
