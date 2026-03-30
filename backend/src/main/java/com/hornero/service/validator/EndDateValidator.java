package com.hornero.service.validator;

import com.hornero.model.Campaign;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class EndDateValidator implements CampaignPublishValidator {

    @Override
    public void validate(Campaign campaign) {
        if (campaign.getEndDate() == null) {
            throw new IllegalStateException("La campaña debe tener una fecha de finalización");
        }
        if (!campaign.getEndDate().isAfter(LocalDate.now())) {
            throw new IllegalStateException("La fecha de finalización debe ser una fecha futura");
        }
    }
}
