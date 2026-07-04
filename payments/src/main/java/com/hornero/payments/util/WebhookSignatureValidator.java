package com.hornero.payments.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

// Valida la firma HMAC-SHA256 que Mercado Pago incluye en cada webhook.
// Documentacion: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
@Component
public class WebhookSignatureValidator {

    private static final Logger logger = LoggerFactory.getLogger(WebhookSignatureValidator.class);

    @Value("${mercadopago.webhook.secret:}")
    private String webhookSecret;

    // Retorna true si la firma es valida o si el secret no esta configurado (modo desarrollo).
    // Retorna false si el secret esta configurado y la firma no coincide.
    public boolean isValid(String xSignature, String xRequestId, String dataId) {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            logger.warn("MP_WEBHOOK_SECRET no configurado, omitiendo validacion de firma");
            return true;
        }

        try {
            String ts = null;
            String v1 = null;

            for (String part : xSignature.split(",")) {
                String[] kv = part.trim().split("=", 2);
                if (kv.length == 2) {
                    if ("ts".equals(kv[0].trim()))  ts = kv[1].trim();
                    if ("v1".equals(kv[0].trim()))  v1 = kv[1].trim();
                }
            }

            if (ts == null || v1 == null) {
                logger.warn("x-signature malformado: {}", xSignature);
                return false;
            }

            String manifest = "id=" + dataId + "&request-id=" + xRequestId + "&ts=" + ts;

            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(manifest.getBytes(StandardCharsets.UTF_8));

            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }

            boolean valid = hex.toString().equals(v1);
            if (!valid) {
                logger.warn("Firma de webhook invalida para dataId={}", dataId);
            }
            return valid;

        } catch (Exception e) {
            logger.error("Error validando firma de webhook: {}", e.getMessage());
            return false;
        }
    }
}
