package com.hornero.config;

import com.hornero.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        try {
            // Extract JWT from cookie
            String jwt = getJwtFromCookie(request);
            
            if (jwt != null && jwtUtil.validateToken(jwt)) {
                // Extract user information from token
                String email = jwtUtil.extractEmail(jwt);
                Long userId = jwtUtil.extractUserId(jwt);
                String role = jwtUtil.extractRole(jwt);
                
                // Create authentication token
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    email, 
                    null, 
                    Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role))
                );
                
                // Set authentication in security context
                SecurityContextHolder.getContext().setAuthentication(authentication);
                
                // Add user info to request attributes for easy access
                request.setAttribute("userId", userId);
                request.setAttribute("userEmail", email);
                request.setAttribute("userRole", role);
            }
        } catch (Exception e) {
            logger.error("Cannot set user authentication: {}", e);
        }
        
        filterChain.doFilter(request, response);
    }
    
    private String getJwtFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("jwt".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}
