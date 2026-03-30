package com.hornero.service.validator;

import com.hornero.model.Campaign;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class TargetAmountValidator implements CampaignPublishValidator {

    @Override
    public void validate(Campaign campaign) {
        if (campaign.getTargetAmount() == null || campaign.getTargetAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalStateException("La campaña debe tener un monto objetivo mayor a cero");
        }
    }
}
