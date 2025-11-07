package com.hornero.model;

import jakarta.persistence.*;

@Entity
@Table(name = "campaign")
public class Campaign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "short_description")
    private String shortDescription;

    @Column(name = "id_owner")
    private Long idOwner;

    @Column(name = "id_type")
    private Long idType;

    @Column(name = "id_category")
    private Long idCategory;

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getShortDescription() { return shortDescription; }
    public void setShortDescription(String shortDescription) { this.shortDescription = shortDescription; }

    public Long getIdOwner() { return idOwner; }
    public void setIdOwner(Long idOwner) { this.idOwner = idOwner; }

    public Long getIdType() { return idType; }
    public void setIdType(Long idType) { this.idType = idType; }

    public Long getIdCategory() { return idCategory; }
    public void setIdCategory(Long idCategory) { this.idCategory = idCategory; }
}
