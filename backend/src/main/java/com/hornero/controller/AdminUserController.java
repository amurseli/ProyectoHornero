package com.hornero.controller;

import com.hornero.dto.AdminUserListResponse;
import com.hornero.dto.AdminUserResponse;
import com.hornero.dto.AdminUserStatusRequest;
import com.hornero.dto.ErrorResponse;
import com.hornero.model.User;
import com.hornero.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<?> listUsers(
            HttpServletRequest request,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        try {
            String userRole = (String) request.getAttribute("userRole");
            if (!"ADMIN".equals(userRole)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ErrorResponse("Acceso denegado", HttpStatus.FORBIDDEN.value()));
            }

            AdminUserListResponse response = userService.listUsers(Math.max(page, 0), Math.max(size, 1));
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    @PostMapping("/{id}/promote-admin")
    public ResponseEntity<?> promoteToAdmin(HttpServletRequest request, @PathVariable Long id) {
        try {
            String userRole = (String) request.getAttribute("userRole");
            Long actorUserId = (Long) request.getAttribute("userId");
            if (!"ADMIN".equals(userRole)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ErrorResponse("Acceso denegado", HttpStatus.FORBIDDEN.value()));
            }

            User updated = userService.promoteToAdmin(id, actorUserId);
            return ResponseEntity.ok(AdminUserResponse.fromEntity(updated));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    @PostMapping("/{id}/remove-admin")
    public ResponseEntity<?> removeAdmin(HttpServletRequest request, @PathVariable Long id) {
        try {
            String userRole = (String) request.getAttribute("userRole");
            if (!"ADMIN".equals(userRole)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ErrorResponse("Acceso denegado", HttpStatus.FORBIDDEN.value()));
            }

            User updated = userService.removeAdmin(id);
            return ResponseEntity.ok(AdminUserResponse.fromEntity(updated));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            HttpServletRequest request,
            @PathVariable Long id,
            @Valid @RequestBody AdminUserStatusRequest statusRequest) {
        try {
            String userRole = (String) request.getAttribute("userRole");
            Long actorUserId = (Long) request.getAttribute("userId");
            if (!"ADMIN".equals(userRole)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ErrorResponse("Acceso denegado", HttpStatus.FORBIDDEN.value()));
            }

            User updated = userService.setUserEnabled(id, statusRequest.getEnabled(), actorUserId);
            return ResponseEntity.ok(AdminUserResponse.fromEntity(updated));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST.value()));
        }
    }
}
