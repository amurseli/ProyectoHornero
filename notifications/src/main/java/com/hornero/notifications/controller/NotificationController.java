package com.hornero.notifications.controller;

import com.hornero.notifications.dto.NotificationResponse;
import com.hornero.notifications.dto.PageResponse;
import com.hornero.notifications.dto.UnreadCountResponse;
import com.hornero.notifications.model.Notification;
import com.hornero.notifications.service.NotificationService;
import com.hornero.notifications.util.JwtUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final JwtUtil jwtUtil;

    public NotificationController(NotificationService notificationService, JwtUtil jwtUtil) {
        this.notificationService = notificationService;
        this.jwtUtil = jwtUtil;
    }

    // GET /api/notifications?page=0&size=20&unreadOnly=false
    @GetMapping
    public ResponseEntity<PageResponse<NotificationResponse>> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(name = "unreadOnly", defaultValue = "false") boolean unreadOnly,
            HttpServletRequest httpRequest) {

        Long userId = extractUserIdFromRequest(httpRequest);
        Pageable pageable = PageRequest.of(page, size);

        Page<Notification> notifications = notificationService.getNotifications(userId, unreadOnly, pageable);
        return ResponseEntity.ok(toPageResponse(notifications));
    }

    // GET /api/notifications/unread-count
    @GetMapping("/unread-count")
    public ResponseEntity<UnreadCountResponse> getUnreadCount(HttpServletRequest httpRequest) {
        Long userId = extractUserIdFromRequest(httpRequest);
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(new UnreadCountResponse(count));
    }

    // PATCH /api/notifications/{id}/read
    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id, HttpServletRequest httpRequest) {
        Long userId = extractUserIdFromRequest(httpRequest);
        notificationService.markAsRead(id, userId);
        return ResponseEntity.noContent().build();
    }

    // PATCH /api/notifications/read-all
    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(HttpServletRequest httpRequest) {
        Long userId = extractUserIdFromRequest(httpRequest);
        notificationService.markAllAsRead(userId);
        return ResponseEntity.noContent().build();
    }

    private PageResponse<NotificationResponse> toPageResponse(Page<Notification> notifications) {
        List<NotificationResponse> content = notifications.getContent().stream()
                .map(this::toResponse)
                .toList();

        return new PageResponse<>(
                content,
                notifications.getTotalElements(),
                notifications.getTotalPages(),
                notifications.getNumber(),
                notifications.getSize()
        );
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getCampaignId(),
                notification.getRead(),
                notification.getCreatedAt()
        );
    }

    // Extrae el userId del cookie accessToken usando el JwtUtil (mismo approach que payments)
    private Long extractUserIdFromRequest(HttpServletRequest request) {
        String token = null;

        if (request.getCookies() != null) {
            token = Arrays.stream(request.getCookies())
                    .filter(c -> "jwt".equals(c.getName()))
                    .map(Cookie::getValue)
                    .findFirst()
                    .orElse(null);
        }

        if (token == null) {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            }
        }

        if (token == null || !jwtUtil.validateToken(token)) {
            throw new SecurityException("Token de autenticacion invalido o ausente");
        }

        return jwtUtil.extractUserId(token);
    }
}
