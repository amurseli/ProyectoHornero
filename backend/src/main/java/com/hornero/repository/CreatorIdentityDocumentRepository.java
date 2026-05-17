package com.hornero.repository;

import com.hornero.model.CreatorIdentityDocument;
import com.hornero.model.CreatorIdentityDocument.DocumentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CreatorIdentityDocumentRepository extends JpaRepository<CreatorIdentityDocument, Long> {
    List<CreatorIdentityDocument> findByUserId(Long userId);
    Optional<CreatorIdentityDocument> findByUserIdAndDocumentType(Long userId, DocumentType documentType);
    void deleteByUserId(Long userId);
}
