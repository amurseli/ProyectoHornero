package com.hornero.notifications.dto;

import java.math.BigDecimal;

// Resumen minimo de un aportante, usado para armar el detalle en el mail
// que recibe el creador cuando su campania alcanza el objetivo.
public class ContributorSummary {

    private final String firstName;
    private final BigDecimal amount;

    public ContributorSummary(String firstName, BigDecimal amount) {
        this.firstName = firstName;
        this.amount = amount;
    }

    public String getFirstName() { return firstName; }
    public BigDecimal getAmount() { return amount; }
}
