package com.hornero.controller;

import com.hornero.model.Campaign;
import com.hornero.model.CampaignCategory;
import com.hornero.model.Country;
import com.hornero.model.Currency;
import com.hornero.repository.CountryRepository;
import com.hornero.repository.CurrencyRepository;
import com.hornero.service.CampaignService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/campaigns")
@CrossOrigin(origins = "*")
public class CampaignController {

    @Autowired
    private CampaignService campaignService;

    @Autowired
    private CountryRepository countryRepository;

    @Autowired
    private CurrencyRepository currencyRepository;

    @Value("${app.service-key:internal-secret-dev}")
    private String serviceKey;

    @GetMapping
    public ResponseEntity<?> getPublicCampaigns(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false, defaultValue = "12") Integer size) {
        if (page != null) {
            int safePage = Math.max(0, page);
            int safeSize = (size == null || size <= 0) ? 12 : size;
            Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by("id").ascending());
            return ResponseEntity.ok(campaignService.getPublicCampaignsPaged(search, categoryId, pageable));
        }
        return ResponseEntity.ok(campaignService.getPublicCampaigns());
    }

    @GetMapping("/home")
    public ResponseEntity<Map<String, List<Campaign>>> getHomeSections(
            @RequestParam(required = false, defaultValue = "6") Integer spotlight,
            @RequestParam(required = false, defaultValue = "6") Integer featured,
            @RequestParam(required = false, defaultValue = "4") Integer endingSoon,
            @RequestParam(required = false, defaultValue = "4") Integer nearGoal,
            @RequestParam(required = false, defaultValue = "8") Integer recent) {
        return ResponseEntity.ok(
                campaignService.getHomeSections(spotlight, featured, endingSoon, nearGoal, recent));
    }

    @GetMapping("/home/category/{categoryId}")
    public ResponseEntity<List<Campaign>> getCategorySection(
            @PathVariable Long categoryId,
            @RequestParam(required = false, defaultValue = "6") Integer limit) {
        List<Campaign> campaigns = campaignService.getCategorySection(categoryId, limit);
        if (campaigns.isEmpty()) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(campaigns);
    }

    @GetMapping("/categories")
    public List<CampaignCategory> getCategories() {
        return campaignService.getAllCategories();
    }

    @GetMapping("/categories/active")
    public List<CampaignCategory> getCategoriesWithActiveCampaigns() {
        return campaignService.getCategoriesWithActiveCampaigns();
    }

    @GetMapping("/countries")
    public List<Country> getCountries() {
        return countryRepository.findAll();
    }

    @GetMapping("/currencies")
    public List<Currency> getCurrencies() {
        return currencyRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Campaign> getCampaignById(
            @PathVariable Long id,
            @RequestHeader(value = "X-Service-Key", required = false) String incomingKey,
            HttpServletRequest request) {
        Campaign campaign = campaignService.getCampaignById(id).orElse(null);
        if (campaign == null) return ResponseEntity.notFound().build();

        if (serviceKey.equals(incomingKey)) return ResponseEntity.ok(campaign);

        String status = campaign.getStatus();
        if ("CROWDFUNDING".equals(status) || "SUCCESSFUL".equals(status) || "FAILED".equals(status)) {
            return ResponseEntity.ok(campaign);
        }

        Long requestingUserId = (Long) request.getAttribute("userId");
        boolean isOwner = requestingUserId != null
                && campaign.getOwner() != null
                && campaign.getOwner().getId().equals(requestingUserId);

        return isOwner ? ResponseEntity.ok(campaign) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<Campaign> createCampaign(@RequestBody Campaign campaign) {
        Campaign newCampaign = campaignService.createCampaign(campaign);
        return ResponseEntity.status(HttpStatus.CREATED).body(newCampaign);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCampaign(@PathVariable Long id, @RequestBody Campaign campaignDetails, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        String userRole = (String) request.getAttribute("userRole");

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            Campaign updated = campaignService.updateCampaign(id, campaignDetails, userId, userRole);
            return ResponseEntity.ok(updated);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<?> publishCampaign(@PathVariable Long id, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        String userRole = (String) request.getAttribute("userRole");

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            Campaign published = campaignService.publishCampaign(id, userId, userRole);
            return ResponseEntity.ok(published);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/current-amount")
    public ResponseEntity<Void> addToCurrentAmount(
            @PathVariable Long id,
            @RequestBody Map<String, BigDecimal> body,
            @RequestHeader("X-Service-Key") String incomingKey) {

        if (!serviceKey.equals(incomingKey)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        BigDecimal amount = body.get("amount");
        if (amount == null) {
            return ResponseEntity.badRequest().build();
        }

        campaignService.addToCampaignAmount(id, amount);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/money-status")
    public ResponseEntity<Void> updateMoneyStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @RequestHeader("X-Service-Key") String incomingKey) {

        if (!serviceKey.equals(incomingKey)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        String moneyStatus = body.get("moneyStatus");
        if (moneyStatus == null || moneyStatus.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        try {
            campaignService.updateMoneyStatus(id, moneyStatus);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCampaign(@PathVariable Long id) {
        try {
            campaignService.deleteCampaign(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}