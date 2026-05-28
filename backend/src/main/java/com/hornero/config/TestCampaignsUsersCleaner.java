package com.hornero.config;

import com.hornero.model.Campaign;
import com.hornero.model.User;
import com.hornero.repository.CampaignRepository;
import com.hornero.repository.CreatorVerificationRepository;
import com.hornero.repository.UserRepository;
import com.hornero.service.CampaignService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// Mirror of TestCampaignsUsersSeeder for the cleanup direction.
// Activated when CREATE_TEST_CAMPAIGNS_USERS=false (the flag exists and is "false").
// When the flag is absent (production default), this bean does not load.
// Idempotent: if there's nothing to clean up, it's a no-op.
@Component
@ConditionalOnProperty(name = "app.seed.test-campaigns-users", havingValue = "false")
@Order(20)
public class TestCampaignsUsersCleaner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(TestCampaignsUsersCleaner.class);

    @Autowired private UserRepository userRepository;
    @Autowired private CampaignRepository campaignRepository;
    @Autowired private CreatorVerificationRepository creatorVerificationRepository;
    @Autowired private CampaignService campaignService;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        // Route each delete through CampaignService.deleteCampaign so the same path that
        // handles normal campaign deletes also removes the S3 image objects (via
        // appImageService.deleteImage) before the DB row is cascaded away. Calling JPA's
        // deleteAll directly would leave the S3 objects orphaned in the bucket.
        List<Campaign> testCampaigns = campaignRepository.findByIsTest(true);
        if (!testCampaigns.isEmpty()) {
            for (Campaign campaign : testCampaigns) {
                campaignService.deleteCampaign(campaign.getId());
            }
            log.info("Deleted {} test campaigns (DB rows + S3 image objects) flagged isTest=true",
                    testCampaigns.size());
        }

        // Then delete the seeded creator users. The email-LIKE pattern targets only
        // users created by TestCampaignsUsersSeeder, leaving any other test/seeded
        // accounts (e.g. those from TestDataSeeder) untouched.
        List<User> seededUsers = userRepository.findByEmailLike(TestCampaignsUsersSeeder.EMAIL_PATTERN);
        if (seededUsers.isEmpty()) {
            if (testCampaigns.isEmpty()) {
                log.debug("CREATE_TEST_CAMPAIGNS_USERS=false: nothing to clean up");
            }
            return;
        }

        // creator_verification has no ON DELETE CASCADE on user_id, so remove it explicitly.
        for (User u : seededUsers) {
            creatorVerificationRepository.findByUserId(u.getId())
                    .ifPresent(creatorVerificationRepository::delete);
        }

        // DB-level cascades clean up refresh_tokens, password_reset_token,
        // email_verification_token, email_change_token, user_connection,
        // and creators_campaign rows belonging to these users.
        userRepository.deleteAll(seededUsers);
        log.info("Deleted {} seeded creator users matching {}", seededUsers.size(),
                TestCampaignsUsersSeeder.EMAIL_PATTERN);
    }
}
