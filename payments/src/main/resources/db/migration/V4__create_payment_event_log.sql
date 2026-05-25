CREATE TABLE payments.payment_event_log (
    id              BIGSERIAL    PRIMARY KEY,
    entity_type     VARCHAR(20)  NOT NULL,
    entity_id       BIGINT       NOT NULL,
    event_type      VARCHAR(50)  NOT NULL,
    previous_status VARCHAR(30),
    new_status      VARCHAR(30),
    message         TEXT,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_event_log_entity ON payments.payment_event_log (entity_type, entity_id);
