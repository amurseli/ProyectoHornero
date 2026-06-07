package com.hornero.service.validator;

import com.hornero.model.Campaign;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.*;

class EndDateValidatorTest {

    private final EndDateValidator validator = new EndDateValidator();

    @Test
    void validate_whenEndDateIsNull_throwsIllegalState() {
        Campaign campaign = new Campaign();
        campaign.setEndDate(null);

        assertThatThrownBy(() -> validator.validate(campaign))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("fecha de finalización");
    }

    @Test
    void validate_whenEndDateIsToday_throwsIllegalState() {
        Campaign campaign = new Campaign();
        campaign.setEndDate(LocalDate.now());

        assertThatThrownBy(() -> validator.validate(campaign))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("futura");
    }

    @Test
    void validate_whenEndDateIsFuture_passes() {
        Campaign campaign = new Campaign();
        campaign.setEndDate(LocalDate.now().plusDays(1));

        assertThatNoException().isThrownBy(() -> validator.validate(campaign));
    }
}
