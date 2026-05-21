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

    // GET /api/campaigns — solo campañas en CROWDFUNDING (vista pública)
    // Si se provee ?page (0-based), devuelve un Page<Campaign> con search/categoryId aplicados.
    // Sin ?page, devuelve la lista completa por compatibilidad con los listados actuales.
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

    // GET /api/campaigns/categories — lista de categorías disponibles
    @GetMapping("/categories")
    public List<CampaignCategory> getCategories() {
        return campaignService.getAllCategories();
    }

    // GET /api/campaigns/countries — lista de países disponibles para crear campañas
    @GetMapping("/countries")
    public List<Country> getCountries() {
        return countryRepository.findAll();
    }

    // GET /api/campaigns/currencies — lista de monedas soportadas (incluye minor_unit)
    @GetMapping("/currencies")
    public List<Currency> getCurrencies() {
        return currencyRepository.findAll();
    }

    // GET /api/campaigns/{id}
    // Devuelve la campaña si está en CROWDFUNDING (cualquier visitante)
    // o si el usuario autenticado es el dueño (cualquier estado)
    @GetMapping("/{id}")
    public ResponseEntity<Campaign> getCampaignById(@PathVariable Long id, HttpServletRequest request) {
        Campaign campaign = campaignService.getCampaignById(id).orElse(null);
        if (campaign == null) return ResponseEntity.notFound().build();

        if ("CROWDFUNDING".equals(campaign.getStatus())) return ResponseEntity.ok(campaign);

        Long requestingUserId = (Long) request.getAttribute("userId");
        boolean isOwner = requestingUserId != null
                && campaign.getOwner() != null
                && campaign.getOwner().getId().equals(requestingUserId);

        return isOwner ? ResponseEntity.ok(campaign) : ResponseEntity.notFound().build();
    }

    // POST /api/campaigns
    @PostMapping
    public ResponseEntity<Campaign> createCampaign(@RequestBody Campaign campaign) {
        Campaign newCampaign = campaignService.createCampaign(campaign);
        return ResponseEntity.status(HttpStatus.CREATED).body(newCampaign);
    }

    // PUT /api/campaigns/{id}
    @PutMapping("/{id}")
    public ResponseEntity<Campaign> updateCampaign(@PathVariable Long id, @RequestBody Campaign campaignDetails) {
        try {
            Campaign updated = campaignService.updateCampaign(id, campaignDetails);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // POST /api/campaigns/{id}/publish
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

    // PATCH /api/campaigns/{id}/current-amount
    // Llamado internamente por el payments service cuando una contribucion es aprobada
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

    // DELETE /api/campaigns/{id}
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
