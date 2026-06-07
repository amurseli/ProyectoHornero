package com.hornero.service.validator;

import com.hornero.model.Campaign;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.*;

class TargetAmountValidatorTest {

    private final TargetAmountValidator validator = new TargetAmountValidator();

    @Test
    void validate_whenTargetAmountIsNull_throwsIllegalState() {
        Campaign campaign = new Campaign();
        campaign.setTargetAmount(null);

        assertThatThrownBy(() -> validator.validate(campaign))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("monto objetivo");
    }

    @Test
    void validate_whenTargetAmountIsZero_throwsIllegalState() {
        Campaign campaign = new Campaign();
        campaign.setTargetAmount(BigDecimal.ZERO);

        assertThatThrownBy(() -> validator.validate(campaign))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("mayor a cero");
    }

    @Test
    void validate_whenTargetAmountIsPositive_passes() {
        Campaign campaign = new Campaign();
        campaign.setTargetAmount(new BigDecimal("50000"));

        assertThatNoException().isThrownBy(() -> validator.validate(campaign));
    }
}
