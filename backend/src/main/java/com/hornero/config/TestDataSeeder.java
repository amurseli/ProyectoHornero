package com.hornero.config;

import com.hornero.model.*;
import com.hornero.model.CreatorVerification.TaxCondition;
import com.hornero.model.CreatorVerification.VerificationStatus;
import com.hornero.repository.*;
import com.hornero.service.EncryptionService;
import com.hornero.service.CampaignService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

/**
 * Seeds the database with test users, creators, and campaigns when
 * {@code app.testing-mode.enabled=true}.
 *
 * <p>Enable via the {@code TEST_MODE_ENABLED=true} environment variable (or the
 * property directly in application.yml). The seeder is idempotent — it checks
 * for existing records before inserting, so restarting the application will not
 * create duplicates.
 *
 * <p>Each seeded campaign contains media that mirrors the format produced by
 * the Create Campaign wizard:
 * <ul>
 *   <li>A primary cover image (base64-encoded PNG, {@code isPrimary=true})</li>
 *   <li>Two additional gallery images (base64-encoded PNGs)</li>
 *   <li>One video entry (YouTube URL, {@code mediaType="VIDEO"})</li>
 * </ul>
 */
@Component
@ConditionalOnProperty(name = "app.testing-mode.enabled", havingValue = "true")
public class TestDataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(TestDataSeeder.class);

    // Public-domain Blender Foundation short films — safe to use as test video URLs
    private static final String[] VIDEO_URLS = {
        "https://www.youtube.com/watch?v=aqz-KE-bpKQ",  // Big Buck Bunny
        "https://www.youtube.com/watch?v=YE7VzlLtp-4",  // Elephants Dream
        "https://www.youtube.com/watch?v=_cMxraX_5RE",  // Sintel
        "https://www.youtube.com/watch?v=eRsGyueVLvQ",  // Tears of Steel
    };

    // ── Category theme colours (R, G, B) ─────────────────────────────────────
    // cover, gallery-1, gallery-2
    private static final int[][] TECH_COLORS  = {{41,128,185}, {52,152,219}, {93,173,226}};
    private static final int[][] EDU_COLORS   = {{39,174, 96}, {46,204,113}, {88,214,141}};
    private static final int[][] HEALTH_COLORS= {{192, 57, 43},{231, 76, 60},{236,112,99}};
    private static final int[][] ENV_COLORS   = {{22,160,133}, {26,188,156}, {72,201,176}};
    private static final int[][] ART_COLORS   = {{142, 68,173},{155, 89,182},{175,122,197}};
    private static final int[][] COM_COLORS   = {{230,126, 34},{243,156, 18},{248,196, 113}};

    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private CampaignRepository campaignRepository;
    @Autowired private CampaignCategoryRepository campaignCategoryRepository;
    @Autowired private CreatorVerificationRepository creatorVerificationRepository;
    @Autowired private CreatorsCampaignRepository creatorsCampaignRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private EncryptionService encryptionService;
    @Autowired private CampaignService campaignService;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        // Required for BufferedImage in headless server environments
        System.setProperty("java.awt.headless", "true");

        log.warn("=======================================================");
        log.warn("  TEST MODE ACTIVE — seeding sample data into the DB   ");
        log.warn("  Do NOT enable this in production environments!        ");
        log.warn("=======================================================");

        Role contributorRole = roleRepository.findByName("CONTRIBUTOR")
                .orElseThrow(() -> new IllegalStateException("Role CONTRIBUTOR not found"));
        Role creatorRole = roleRepository.findByName("CREATOR")
                .orElseThrow(() -> new IllegalStateException("Role CREATOR not found"));

        List<CampaignCategory> categories = campaignCategoryRepository.findAll();
        if (categories.isEmpty()) {
            throw new IllegalStateException("No campaign categories found — run Flyway migrations first");
        }

        // ── Regular contributor users ────────────────────────────────────────
        createUserIfAbsent("alice",   "alice@test.com",   "Alice",   "Smith",   contributorRole);
        createUserIfAbsent("bob",     "bob@test.com",     "Bob",     "Jones",   contributorRole);
        createUserIfAbsent("charlie", "charlie@test.com", "Charlie", "Brown",   contributorRole);

        // ── Creator users (with approved verification + campaigns) ───────────
        User creator1 = createUserIfAbsent("maria_c",  "maria@test.com",  "María",  "González",  creatorRole);
        User creator2 = createUserIfAbsent("juan_c",   "juan@test.com",   "Juan",   "Pérez",     creatorRole);
        User creator3 = createUserIfAbsent("laura_c",  "laura@test.com",  "Laura",  "Rodríguez", creatorRole);

        approveCreatorIfAbsent(creator1, "María González",  "20123456789", "20123456789");
        approveCreatorIfAbsent(creator2, "Juan Pérez",      "20234567890", "20234567890");
        approveCreatorIfAbsent(creator3, "Laura Rodríguez", "20345678901", "20345678901");

        // Mapped to the canonical campaign categories defined in migration V16.
        CampaignCategory tech      = categoryByName(categories, "Tecnología");
        CampaignCategory education = categoryByName(categories, "Publicaciones");
        CampaignCategory community = categoryByName(categories, "Teatro");
        CampaignCategory health    = categoryByName(categories, "Comida");
        CampaignCategory art       = categoryByName(categories, "Arte");
        CampaignCategory env       = categoryByName(categories, "Fotografía");

        int videoIdx = 0;

        // ── María González — 4 campaigns ─────────────────────────────────────
        createCampaignIfAbsent(creator1,
                "Plataforma de aprendizaje online",
                "Una plataforma open-source para cursos de programación para jóvenes en Argentina. "
                + "El proyecto busca democratizar el acceso a la educación tecnológica mediante "
                + "contenidos interactivos, mentorías virtuales y certificaciones gratuitas.",
                "Cursos de código para jóvenes",
                tech, 1, 90, "150000.00", "CROWDFUNDING", TECH_COLORS, VIDEO_URLS[videoIdx++ % VIDEO_URLS.length]);

        createCampaignIfAbsent(creator1,
                "Biblioteca Digital Comunitaria",
                "Digitalización de libros y materiales educativos para comunidades rurales de Argentina. "
                + "Incluye la creación de una app offline que permite descargar contenido en zonas "
                + "sin conectividad continua.",
                "Libros digitales para zonas sin internet",
                education, 1, 120, "80000.00", "CROWDFUNDING", EDU_COLORS, VIDEO_URLS[videoIdx++ % VIDEO_URLS.length]);

        createCampaignIfAbsent(creator1,
                "App de Idiomas para Zonas Rurales",
                "Desarrollo de una aplicación móvil gamificada para aprender inglés y portugués "
                + "pensada para estudiantes rurales con acceso limitado a clases presenciales.",
                "Inglés y portugués para el campo",
                tech, 5, 60, "95000.00", "DRAFT", TECH_COLORS, VIDEO_URLS[videoIdx++ % VIDEO_URLS.length]);

        createCampaignIfAbsent(creator1,
                "Podcast Educativo Latinoamericano",
                "Producción y distribución gratuita de episodios de podcast sobre ciencia, historia "
                + "y actualidad para estudiantes secundarios de toda Latinoamérica.",
                "Ciencia e historia en audio para secundaria",
                education, 3, 75, "45000.00", "CROWDFUNDING", EDU_COLORS, VIDEO_URLS[videoIdx++ % VIDEO_URLS.length]);

        // ── Juan Pérez — 4 campaigns ──────────────────────────────────────────
        createCampaignIfAbsent(creator2,
                "Huerta Urbana Solidaria",
                "Red de huertas comunitarias en barrios populares del GBA para garantizar el acceso "
                + "a alimentación sana y fresca. El proyecto conecta vecinos, brinda talleres de "
                + "agricultura urbana y distribuye excedentes en comedores.",
                "Huertas en barrios populares del GBA",
                community, 1, 60, "50000.00", "CROWDFUNDING", COM_COLORS, VIDEO_URLS[videoIdx++ % VIDEO_URLS.length]);

        createCampaignIfAbsent(creator2,
                "Clínica Móvil Rural",
                "Unidad médica itinerante equipada para atención primaria en localidades rurales del "
                + "interior del país que carecen de acceso a servicios de salud. Incluye odontología, "
                + "pediatría y vacunación.",
                "Atención primaria en el interior del país",
                health, 5, 180, "300000.00", "DRAFT", HEALTH_COLORS, VIDEO_URLS[videoIdx++ % VIDEO_URLS.length]);

        createCampaignIfAbsent(creator2,
                "Red de Comedores Comunitarios",
                "Expansión y mejora de la infraestructura de 15 comedores comunitarios en el Conurbano "
                + "bonaerense. Los fondos se destinarán a equipamiento de cocinas, provisión de insumos "
                + "y capacitación en nutrición.",
                "Mejora de comedores en el Conurbano",
                community, 2, 50, "120000.00", "CROWDFUNDING", COM_COLORS, VIDEO_URLS[videoIdx++ % VIDEO_URLS.length]);

        createCampaignIfAbsent(creator2,
                "Botiquín Digital para Barrios",
                "Plataforma web de primeros auxilios y guías de salud preventiva, diseñada para vecinos "
                + "sin acceso regular a médicos. Disponible en español y en lenguas indígenas.",
                "Primeros auxilios online para comunidades",
                health, 1, 90, "70000.00", "CROWDFUNDING", HEALTH_COLORS, VIDEO_URLS[videoIdx++ % VIDEO_URLS.length]);

        // ── Laura Rodríguez — 4 campaigns ────────────────────────────────────
        createCampaignIfAbsent(creator3,
                "Festival de Arte Independiente",
                "Tres días de música en vivo, exposiciones de pintura y funciones de teatro con artistas "
                + "emergentes de todo el país. Entrada libre y gratuita, con talleres abiertos a la "
                + "comunidad.",
                "Arte emergente en vivo, entrada libre",
                art, 10, 45, "120000.00", "CROWDFUNDING", ART_COLORS, VIDEO_URLS[videoIdx++ % VIDEO_URLS.length]);

        createCampaignIfAbsent(creator3,
                "Reciclaje Consciente en Escuelas",
                "Programa integral de educación ambiental e instalación de puntos de reciclaje diferenciado "
                + "en 30 escuelas públicas de CABA y GBA. Incluye talleres, material didáctico y seguimiento "
                + "de impacto.",
                "Reciclaje diferenciado en escuelas públicas",
                env, 1, 75, "60000.00", "CROWDFUNDING", ENV_COLORS, VIDEO_URLS[videoIdx++ % VIDEO_URLS.length]);

        createCampaignIfAbsent(creator3,
                "Mural Colectivo Nacional",
                "Convocatoria abierta para crear un mural colaborativo de 200 metros en el barrio de La Boca, "
                + "con artistas de todas las provincias. El proceso será documentado y exhibido en un "
                + "documental de acceso libre.",
                "Mural de 200m con artistas de todo el país",
                art, 7, 55, "90000.00", "CROWDFUNDING", ART_COLORS, VIDEO_URLS[videoIdx++ % VIDEO_URLS.length]);

        createCampaignIfAbsent(creator3,
                "Energía Solar para Comunidades",
                "Instalación de paneles solares en escuelas y centros comunitarios de zonas rurales sin red "
                + "eléctrica estable. Cada panel instalado abastece hasta 20 familias y reduce emisiones "
                + "de CO₂ en 3 toneladas anuales.",
                "Paneles solares en zonas sin red eléctrica",
                env, 3, 120, "250000.00", "DRAFT", ENV_COLORS, VIDEO_URLS[videoIdx % VIDEO_URLS.length]);

        log.info("Test data seeding complete — {} campaigns seeded.", 12);
    }

    // ── User helpers ──────────────────────────────────────────────────────────

    private User createUserIfAbsent(String username, String email,
                                    String firstName, String lastName, Role role) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            User u = new User();
            u.setUserName(username);
            u.setEmail(email);
            u.setFirstName(firstName);
            u.setLastName(lastName);
            u.setPassword(passwordEncoder.encode("Test1234!"));
            u.setRole(role);
            u.setEnabled(true);
            u.setEmailVerified(true);
            User saved = userRepository.save(u);
            log.info("Created user: {} ({})", email, role.getName());
            return saved;
        });
    }

    private void approveCreatorIfAbsent(User user, String fullName,
                                        String dni, String cuil) {
        if (creatorVerificationRepository.existsByUserId(user.getId())) {
            return;
        }
        CreatorVerification cv = new CreatorVerification();
        cv.setUser(user);
        cv.setFullLegalName(fullName);
        cv.setDniNumber(encryptionService.encrypt(dni));
        cv.setCuilNumber(encryptionService.encrypt(cuil));
        cv.setDateOfBirth(LocalDate.of(1990, 6, 15));
        cv.setPhoneNumber("+5491112345678");
        cv.setAddressStreet("Av. Corrientes 1234");
        cv.setAddressCity("Buenos Aires");
        cv.setAddressProvince("CABA");
        cv.setAddressZipCode("C1043");
        cv.setTaxCondition(TaxCondition.MONOTRIBUTISTA);
        cv.setVerificationStatus(VerificationStatus.APPROVED);
        cv.setTermsAccepted(true);
        cv.setTermsAcceptedAt(LocalDateTime.now());
        cv.setVerifiedAt(LocalDateTime.now());
        cv.setVerifiedBy("test-seeder");
        creatorVerificationRepository.save(cv);
        log.info("Approved creator verification for: {}", user.getEmail());
    }

    // ── Campaign helper ───────────────────────────────────────────────────────

    /**
     * Creates a campaign (idempotent) with images and a video, mirroring the
     * payload produced by the frontend Create Campaign wizard.
     *
     * @param colors     Three RGB triplets: [cover, gallery-1, gallery-2]
     * @param videoUrl   YouTube / Vimeo URL stored as-is (mediaType = "VIDEO")
     */
    private void createCampaignIfAbsent(User owner, String title,
                                        String description, String shortDescription,
                                        CampaignCategory category,
                                        int daysToStart, int daysToEnd,
                                        String targetAmount, String status,
                                        int[][] colors, String videoUrl) {
        boolean exists = campaignRepository.findAllWithRelations().stream()
                .anyMatch(c -> title.equals(c.getTitle())
                        && owner.getId().equals(c.getOwner().getId()));
        if (exists) return;

        Campaign c = new Campaign();
        c.setTitle(title);
        c.setDescription(description);
        c.setShortDescription(shortDescription);
        c.setOwner(owner);
        c.setCategory(category);
        c.setStartDate(LocalDate.now().plusDays(daysToStart));
        c.setEndDate(LocalDate.now().plusDays(daysToEnd));
        c.setTargetAmount(new BigDecimal(targetAmount));
        c.setCurrentAmount(BigDecimal.ZERO);
        c.setCountry("Argentina");
        c.setStatus(status);

        // ── Media (matches wizard output format exactly) ──────────────────────
        // Cover image — isPrimary=true, base64Data
        addImage(c, colors[0], true, 0);
        // Two gallery images — isPrimary=false, base64Data
        addImage(c, colors[1], false, 1);
        addImage(c, colors[2], false, 2);
        // Video — url field, mediaType=VIDEO
        addVideo(c, videoUrl, 3);

        Campaign saved = campaignService.createCampaign(c);

        // Link owner in creators_campaign
        CreatorsCampaign link = new CreatorsCampaign();
        link.setCampaign(saved);
        link.setUser(owner);
        link.setRole("OWNER");
        creatorsCampaignRepository.save(link);

        log.info("Created campaign '{}' [{}] for {}", title, status, owner.getEmail());
    }

    // ── Media builders ────────────────────────────────────────────────────────

    private void addImage(Campaign campaign, int[] rgb, boolean isPrimary, int order) {
        CampaignMedia m = new CampaignMedia();
        m.setCampaign(campaign);
        m.setMediaType("IMAGE");
        m.setBase64Data(generateColoredPng(rgb[0], rgb[1], rgb[2]));
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

    /**
     * Generates a 400×225 gradient PNG (landscape 16:9) encoded as Base64.
     * No external libraries required — uses {@code java.awt} from the JDK.
     */
    private String generateColoredPng(int r, int g, int b) {
        try {
            BufferedImage img = new BufferedImage(400, 225, BufferedImage.TYPE_INT_RGB);
            Graphics2D g2 = img.createGraphics();
            g2.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            Color primary = new Color(r, g, b);
            Color darker  = new Color(Math.max(0, r - 60), Math.max(0, g - 60), Math.max(0, b - 60));
            g2.setPaint(new GradientPaint(0, 0, primary, 400, 225, darker));
            g2.fillRect(0, 0, 400, 225);
            g2.dispose();
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(img, "png", baos);
            return Base64.getEncoder().encodeToString(baos.toByteArray());
        } catch (Exception e) {
            throw new RuntimeException("Could not generate placeholder PNG for seeder", e);
        }
    }

    // ── Misc helpers ──────────────────────────────────────────────────────────

    private CampaignCategory categoryByName(List<CampaignCategory> categories, String name) {
        return categories.stream()
                .filter(cat -> name.equals(cat.getName()))
                .findFirst()
                .orElse(categories.get(0));
    }
}
