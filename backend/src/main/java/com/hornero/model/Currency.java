package com.hornero.model;

import jakarta.persistence.*;

@Entity
@Table(name = "currency")
public class Currency {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 3)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 8)
    private String symbol;

    @Column(name = "minor_unit", nullable = false)
    private Integer minorUnit = 100;

    public Long getId() { return id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }

    public Integer getMinorUnit() { return minorUnit; }
    public void setMinorUnit(Integer minorUnit) { this.minorUnit = minorUnit; }
}
