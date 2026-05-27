package com.hornero.config;

import com.hornero.model.Campaign;
import com.hornero.model.CampaignCategory;
import com.hornero.model.CampaignMedia;
import com.hornero.model.CreatorVerification;
import com.hornero.model.CreatorVerification.TaxCondition;
import com.hornero.model.CreatorVerification.VerificationStatus;
import com.hornero.model.CreatorsCampaign;
import com.hornero.model.Reward;
import com.hornero.model.Role;
import com.hornero.model.User;
import com.hornero.repository.CampaignCategoryRepository;
import com.hornero.repository.CampaignRepository;
import com.hornero.repository.CreatorVerificationRepository;
import com.hornero.repository.CreatorsCampaignRepository;
import com.hornero.repository.RewardRepository;
import com.hornero.repository.RoleRepository;
import com.hornero.repository.UserRepository;
import com.hornero.service.CampaignService;
import com.hornero.service.EncryptionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.GradientPaint;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Map;

// Seeds 2 approved creators per category × 14 categories = 28 creators, each with
// 5 same-category campaigns (3 reward tiers + 3 category-themed images + 1 video
// each), for 140 campaigns total and 10 campaigns per category. Gated by
// CREATE_TEST_CAMPAIGNS_USERS=true. Idempotent: re-runs skip rows that already exist.
@Component
@ConditionalOnProperty(name = "app.seed.test-campaigns-users", havingValue = "true")
@Order(20)
public class TestCampaignsUsersSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(TestCampaignsUsersSeeder.class);

    static final int CREATORS_PER_CATEGORY = 2;
    static final int CAMPAIGNS_PER_CREATOR = 5;
    static final String EMAIL_DOMAIN = "hornero.test";
    static final String EMAIL_PATTERN = "test-creator-%@" + EMAIL_DOMAIN;
    static final String SHARED_PASSWORD = "Test1234!";

    // Public-domain Blender Foundation short films — safe, persistent placeholders.
    // Cycled across campaigns so every record has a video without inventing URLs.
    private static final String[] VIDEO_URLS = {
            "https://www.youtube.com/watch?v=aqz-KE-bpKQ", // Big Buck Bunny
            "https://www.youtube.com/watch?v=YE7VzlLtp-4", // Elephants Dream
            "https://www.youtube.com/watch?v=_cMxraX_5RE", // Sintel
            "https://www.youtube.com/watch?v=eRsGyueVLvQ", // Tears of Steel
    };

    // Primary RGB per canonical category from V16. Used to tint generated images so
    // every campaign visually advertises its subject (purple = Arte, red = Comics, etc.).
    private static final Map<String, int[]> CATEGORY_PRIMARY = Map.ofEntries(
            Map.entry("Arte",          new int[]{142,  68, 173}),
            Map.entry("Comics",        new int[]{231,  76,  60}),
            Map.entry("Baile",         new int[]{233,  30,  99}),
            Map.entry("Diseño",        new int[]{ 26, 188, 156}),
            Map.entry("Moda",          new int[]{236,  64, 122}),
            Map.entry("Películas",     new int[]{ 33,  47,  61}),
            Map.entry("Comida",        new int[]{230, 126,  34}),
            Map.entry("Juegos",        new int[]{ 76, 175,  80}),
            Map.entry("Periodismo",    new int[]{ 96, 125, 139}),
            Map.entry("Música",        new int[]{ 41,  98, 255}),
            Map.entry("Fotografía",    new int[]{ 55,  71,  79}),
            Map.entry("Publicaciones", new int[]{121,  85,  72}),
            Map.entry("Tecnología",    new int[]{ 41, 128, 185}),
            Map.entry("Teatro",        new int[]{155,  39,  76})
    );

    private static final int[] FALLBACK_PRIMARY = {99, 110, 114};

    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private CampaignRepository campaignRepository;
    @Autowired private CampaignCategoryRepository campaignCategoryRepository;
    @Autowired private CreatorVerificationRepository creatorVerificationRepository;
    @Autowired private CreatorsCampaignRepository creatorsCampaignRepository;
    @Autowired private RewardRepository rewardRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private EncryptionService encryptionService;
    @Autowired private CampaignService campaignService;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        // BufferedImage requires headless mode inside the server JVM.
        System.setProperty("java.awt.headless", "true");

        Role creatorRole = roleRepository.findByName("CREATOR")
                .orElseThrow(() -> new IllegalStateException("Role CREATOR not found"));

        // Sort categories by id so a given (category, slot) always maps to the same
        // creator index across boots — required for idempotent email/username keys.
        List<CampaignCategory> categories = campaignCategoryRepository.findAll().stream()
                .sorted((a, b) -> Long.compare(a.getId(), b.getId()))
                .toList();
        if (categories.isEmpty()) {
            throw new IllegalStateException("No campaign categories found — run Flyway migrations first");
        }

        int targetCreators = categories.size() * CREATORS_PER_CATEGORY;
        int targetCampaigns = targetCreators * CAMPAIGNS_PER_CREATOR;
        log.warn("=======================================================");
        log.warn("  CREATE_TEST_CAMPAIGNS_USERS=true — seeding {} creators ", targetCreators);
        log.warn("  ({} per category × {} categories, {} campaigns total) ", CREATORS_PER_CATEGORY, categories.size(), targetCampaigns);
        log.warn("  Do NOT enable this in production environments!         ");
        log.warn("=======================================================");

        int createdUsers = 0;
        int createdCampaigns = 0;
        int createdRewards = 0;
        int videoCursor = 0;

        for (int categoryPos = 0; categoryPos < categories.size(); categoryPos++) {
            CampaignCategory category = categories.get(categoryPos);

            for (int slot = 0; slot < CREATORS_PER_CATEGORY; slot++) {
                int creatorIdx = categoryPos * CREATORS_PER_CATEGORY + slot + 1;

                User creator = ensureCreator(creatorIdx, creatorRole);
                if (creator.getCreatedAt() != null
                        && creator.getCreatedAt().isAfter(LocalDateTime.now().minusSeconds(5))) {
                    createdUsers++;
                }
                ensureCreatorVerification(creator, creatorIdx);

                for (int j = 1; j <= CAMPAIGNS_PER_CREATOR; j++) {
                    Campaign created = ensureCampaign(creator, category, creatorIdx, j, videoCursor++);
                    if (created != null) {
                        createdCampaigns++;
                        createdRewards += ensureRewards(created);
                    }
                }
            }
        }

        log.info("Seed summary: {} new users, {} new campaigns, {} new rewards (target: {} creators × {} campaigns each = {} total)",
                createdUsers, createdCampaigns, createdRewards, targetCreators, CAMPAIGNS_PER_CREATOR, targetCampaigns);
    }

    private User ensureCreator(int index, Role creatorRole) {
        String email = "test-creator-" + index + "@" + EMAIL_DOMAIN;
        return userRepository.findByEmail(email).orElseGet(() -> {
            User u = new User();
            u.setUserName("test_creator_" + index);
            u.setEmail(email);
            u.setFirstName("Creator");
            u.setLastName("Numero" + index);
            u.setPassword(passwordEncoder.encode(SHARED_PASSWORD));
            u.setRole(creatorRole);
            u.setEnabled(true);
            u.setEmailVerified(true);
            User saved = userRepository.save(u);
            log.info("Created test creator: {}", email);
            return saved;
        });
    }

    private void ensureCreatorVerification(User user, int index) {
        if (creatorVerificationRepository.existsByUserId(user.getId())) {
            return;
        }
        String cuil = String.format("20%09d", 100000000L + index);
        CreatorVerification cv = new CreatorVerification();
        cv.setUser(user);
        cv.setFullLegalName("Creator Numero " + index);
        cv.setDniNumber(encryptionService.encrypt(String.format("%08d", 30000000 + index)));
        cv.setCuilNumber(encryptionService.encrypt(cuil));
        cv.setDateOfBirth(LocalDate.of(1990, 1, 1).plusDays(index));
        cv.setPhoneNumber("+54911" + String.format("%07d", 1000000 + index));
        cv.setAddressStreet("Calle Test " + index);
        cv.setAddressCity("Buenos Aires");
        cv.setAddressProvince("CABA");
        cv.setAddressZipCode("C1043");
        cv.setTaxCondition(TaxCondition.MONOTRIBUTISTA);
        cv.setVerificationStatus(VerificationStatus.APPROVED);
        cv.setTermsAccepted(true);
        cv.setTermsAcceptedAt(LocalDateTime.now());
        cv.setVerifiedAt(LocalDateTime.now());
        cv.setVerifiedBy("test-campaigns-users-seeder");
        creatorVerificationRepository.save(cv);
        log.info("Approved creator verification for: {}", user.getEmail());
    }

    // Returns the newly created Campaign, or null if one with the same title+owner already existed.
    private Campaign ensureCampaign(User owner, CampaignCategory category,
                                    int creatorIdx, int campaignIdx, int videoCursor) {
        String title = String.format("Proyecto %s #%d de Creator %d",
                category.getName(), campaignIdx, creatorIdx);

        boolean exists = campaignRepository.findAllByOwnerIdWithRelations(owner.getId()).stream()
                .anyMatch(c -> title.equals(c.getTitle()));
        if (exists) return null;

        Campaign c = new Campaign();
        c.setTitle(title);
        c.setDescription("Campaña de prueba generada automáticamente para el creador " + creatorIdx
                + ". Categoría: " + category.getName() + ". Esta es la campaña número "
                + campaignIdx + " de 5 para este creador.");
        c.setShortDescription("Campaña de prueba " + campaignIdx + " — " + category.getName());
        c.setOwner(owner);
        c.setCategory(category);
        c.setStartDate(LocalDate.now().plusDays(1));
        c.setEndDate(LocalDate.now().plusDays(60));
        c.setTargetAmount(new BigDecimal("100000.00").add(new BigDecimal(campaignIdx * 25000)));
        c.setCurrentAmount(BigDecimal.ZERO);
        c.setCountry("Argentina");
        c.setStatus("CROWDFUNDING");
        c.setIsTest(true);

        attachMedia(c, category.getName(), campaignIdx, videoCursor);

        Campaign saved = campaignService.createCampaign(c);

        CreatorsCampaign link = new CreatorsCampaign();
        link.setCampaign(saved);
        link.setUser(owner);
        link.setRole("OWNER");
        creatorsCampaignRepository.save(link);

        log.info("Created campaign '{}' for {}", title, owner.getEmail());
        return saved;
    }

    private void attachMedia(Campaign campaign, String categoryName, int campaignIdx, int videoCursor) {
        int[] primary = CATEGORY_PRIMARY.getOrDefault(categoryName, FALLBACK_PRIMARY);

        // Cover: full-saturation gradient + category name as headline
        addImage(campaign, primary, 0.00, categoryName, "Campaña #" + campaignIdx, true, 0);
        // Gallery 1: lighter shade
        addImage(campaign, primary, 0.30, categoryName, "Galería 1", false, 1);
        // Gallery 2: darker shade
        addImage(campaign, primary, -0.25, categoryName, "Galería 2", false, 2);

        addVideo(campaign, VIDEO_URLS[Math.floorMod(videoCursor, VIDEO_URLS.length)], 3);
    }

    private void addImage(Campaign campaign, int[] primaryRgb, double lightnessShift,
                          String headline, String subhead, boolean isPrimary, int order) {
        CampaignMedia m = new CampaignMedia();
        m.setCampaign(campaign);
        m.setMediaType("IMAGE");
        m.setBase64Data(generateCategoryPng(primaryRgb, lightnessShift, headline, subhead));
        m.setIsPrimary(isPrimary);
        m.setDisplayOrder(order);
        campaign.getMedia().add(m);
    }

    private void addVideo(Campaign campaign, String url, int order) {
        CampaignMedia m = new CampaignMedia();
        m.setCampaign(campaign);
        m.setMediaType("VIDEO");
        m.setUrl(url);
        m.setIsPrimary(false);
        m.setDisplayOrder(order);
        campaign.getMedia().add(m);
    }

    // Generates a 600×338 (16:9) Base64-encoded PNG with a category-tinted diagonal
    // gradient and the category name overlaid in large white type. Each call is
    // self-contained — no external assets, no network access.
    private String generateCategoryPng(int[] primaryRgb, double lightnessShift,
                                       String headline, String subhead) {
        final int width = 600, height = 338;
        try {
            BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = img.createGraphics();
            g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

            Color primary = shift(primaryRgb, lightnessShift);
            Color secondary = shift(primaryRgb, lightnessShift - 0.35);
            g.setPaint(new GradientPaint(0, 0, primary, width, height, secondary));
            g.fillRect(0, 0, width, height);

            // Headline (category)
            g.setColor(new Color(255, 255, 255, 235));
            Font headlineFont = new Font(Font.SANS_SERIF, Font.BOLD, 64);
            g.setFont(headlineFont);
            FontMetrics fm = g.getFontMetrics();
            int hx = (width - fm.stringWidth(headline)) / 2;
            int hy = height / 2;
            g.drawString(headline, hx, hy);

            // Subhead (campaign / gallery hint)
            g.setColor(new Color(255, 255, 255, 200));
            Font subFont = new Font(Font.SANS_SERIF, Font.PLAIN, 22);
            g.setFont(subFont);
            FontMetrics sfm = g.getFontMetrics();
            int sx = (width - sfm.stringWidth(subhead)) / 2;
            int sy = hy + 40;
            g.drawString(subhead, sx, sy);

            g.dispose();
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(img, "png", baos);
            return Base64.getEncoder().encodeToString(baos.toByteArray());
        } catch (Exception e) {
            throw new RuntimeException("Could not generate category PNG for seeder", e);
        }
    }

    // shift in [-1, 1]: negative darkens, positive lightens (interpolates toward black/white).
    private static Color shift(int[] rgb, double amount) {
        int r = rgb[0], g = rgb[1], b = rgb[2];
        if (amount >= 0) {
            r = (int) Math.round(r + (255 - r) * amount);
            g = (int) Math.round(g + (255 - g) * amount);
            b = (int) Math.round(b + (255 - b) * amount);
        } else {
            double k = 1 + amount; // amount is negative → k in [0, 1)
            r = (int) Math.round(r * k);
            g = (int) Math.round(g * k);
            b = (int) Math.round(b * k);
        }
        return new Color(clamp(r), clamp(g), clamp(b));
    }

    private static int clamp(int v) {
        return Math.max(0, Math.min(255, v));
    }

    private int ensureRewards(Campaign campaign) {
        if (!rewardRepository.findByCampaignIdOrderByDisplayOrderAsc(campaign.getId()).isEmpty()) {
            return 0;
        }
        String[] tierTitles = { "Apoyo simbólico", "Recompensa media", "Recompensa premium" };
        String[] tierDescriptions = {
                "Agradecimiento personal del creador y mención en la web del proyecto.",
                "Producto físico exclusivo de la campaña y acceso anticipado al contenido.",
                "Edición limitada con dedicatoria + sesión privada con el equipo del proyecto.",
        };
        BigDecimal[] tierPrices = {
                new BigDecimal("5000"),
                new BigDecimal("15000"),
                new BigDecimal("30000"),
        };
        for (int i = 0; i < tierTitles.length; i++) {
            Reward r = new Reward();
            r.setCampaign(campaign);
            r.setTitle(tierTitles[i]);
            r.setDescription(tierDescriptions[i]);
            r.setPrice(tierPrices[i]);
            r.setDisplayOrder(i);
            rewardRepository.save(r);
        }
        return tierTitles.length;
    }
}
