CREATE SCHEMA IF NOT EXISTS notifications;

-- Notificaciones in-app mostradas al usuario dentro de la aplicacion
-- Se generan al procesar eventos publicados por backend y payments via Redis Stream
CREATE TABLE notifications.notification (
    id          BIGSERIAL     PRIMARY KEY,
    user_id     BIGINT        NOT NULL,
    type        VARCHAR(50)   NOT NULL,
    title       VARCHAR(255)  NOT NULL,
    message     TEXT          NOT NULL,
    campaign_id BIGINT,
    read        BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);
-- type: DONATION_SUCCESS | CAMPAIGN_SUCCEEDED_CONTRIBUTOR | CAMPAIGN_FAILED_CONTRIBUTOR
--       | CAMPAIGN_SUCCEEDED_CREATOR | CAMPAIGN_FAILED_CREATOR | PAYOUT_COMPLETED
-- campaign_id es nullable y se usa para deep-link desde el frontend

CREATE INDEX idx_notification_user_id ON notifications.notification (user_id);
CREATE INDEX idx_notification_user_unread ON notifications.notification (user_id, read) WHERE read = FALSE;

-- Registro de eventos ya procesados: evita reenviar mails o duplicar notificaciones
-- ante reintentos del consumer group de Redis Stream (at-least-once delivery)
CREATE TABLE notifications.processed_event (
    event_id     VARCHAR(100) PRIMARY KEY,
    processed_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Auditoria de los mails enviados por el servicio
CREATE TABLE notifications.email_log (
    id              BIGSERIAL    PRIMARY KEY,
    event_id        VARCHAR(100) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    type            VARCHAR(50)  NOT NULL,
    status          VARCHAR(20)  NOT NULL,
    error_message   TEXT,
    sent_at         TIMESTAMP    NOT NULL DEFAULT NOW()
);
-- status: SENT | FAILED

CREATE INDEX idx_email_log_event_id ON notifications.email_log (event_id);
