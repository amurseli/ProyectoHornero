package com.hornero.controller;

import com.hornero.dto.CampaignCommentRequest;
import com.hornero.service.CampaignCommentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/campaigns/{campaignId}/comments")
@CrossOrigin(origins = "*")
public class CampaignCommentController {

    private final CampaignCommentService campaignCommentService;

    public CampaignCommentController(CampaignCommentService campaignCommentService) {
        this.campaignCommentService = campaignCommentService;
    }

    @GetMapping
    public ResponseEntity<?> list(@PathVariable Long campaignId, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        String userRole = (String) request.getAttribute("userRole");

        try {
            return ResponseEntity.ok(campaignCommentService.listByCampaign(campaignId, userId, userRole));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@PathVariable Long campaignId,
                                    @Valid @RequestBody CampaignCommentRequest requestBody,
                                    HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        String userRole = (String) request.getAttribute("userRole");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "No autenticado"));
        }

        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(campaignCommentService.create(campaignId, requestBody, userId, userRole));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        }
    }
}
