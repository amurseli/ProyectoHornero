-- ═══════════════════════════════════════════════════════════
-- Creator Verification Tables
-- ═══════════════════════════════════════════════════════════

-- Tax condition enum type
CREATE TYPE tax_condition AS ENUM ('MONOTRIBUTISTA', 'RESPONSABLE_INSCRIPTO', 'CONSUMIDOR_FINAL', 'EXENTO');

-- Verification status enum type
CREATE TYPE verification_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Account type enum type
CREATE TYPE bank_account_type AS ENUM ('CBU', 'CVU');

-- Document type enum type
CREATE TYPE identity_document_type AS ENUM ('DNI_FRONT', 'DNI_BACK', 'SELFIE_WITH_DNI');

-- Creator verification (personal info + tax situation)
CREATE TABLE IF NOT EXISTS creator_verification (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES "user"(id),
    full_legal_name VARCHAR(255) NOT NULL,
    dni_number VARCHAR(255) NOT NULL,
    cuil_number VARCHAR(255) NOT NULL,
    cuit_number VARCHAR(255),
    date_of_birth DATE NOT NULL,
    phone_number VARCHAR(30) NOT NULL,
    address_street VARCHAR(255) NOT NULL,
    address_city VARCHAR(100) NOT NULL,
    address_province VARCHAR(100) NOT NULL,
    address_zip_code VARCHAR(20) NOT NULL,
    tax_condition tax_condition NOT NULL,
    verification_status verification_status NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT,
    verified_at TIMESTAMP,
    verified_by VARCHAR(255),
    terms_accepted BOOLEAN NOT NULL DEFAULT FALSE,
    terms_accepted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Creator bank info
CREATE TABLE IF NOT EXISTS creator_bank_info (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES "user"(id),
    account_type bank_account_type NOT NULL,
    account_number VARCHAR(255) NOT NULL,
    account_alias VARCHAR(100),
    bank_or_wallet_name VARCHAR(100) NOT NULL,
    account_holder_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Creator identity documents (references to S3 keys)
CREATE TABLE IF NOT EXISTS creator_identity_document (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES "user"(id),
    document_type identity_document_type NOT NULL,
    s3_key VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, document_type)
);
