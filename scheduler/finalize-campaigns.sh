#!/bin/sh
MAX_RETRIES=3
RETRY_DELAY=60

echo "[$(date)] Iniciando finalizacion de campanas..."

for i in $(seq 1 $MAX_RETRIES); do
    HTTP_CODE=$(curl -s -o /tmp/response.json -w "%{http_code}" \
        -X POST "${BACKEND_URL}/internal/finalize-campaigns" \
        -H "X-Service-Key: ${SERVICE_KEY}" \
        -H "Content-Type: application/json" \
        --connect-timeout 10 \
        --max-time 60)

    if [ "$HTTP_CODE" = "200" ]; then
        echo "[$(date)] OK - $(cat /tmp/response.json)"
        exit 0
    fi

    echo "[$(date)] Intento $i/$MAX_RETRIES fallido - HTTP $HTTP_CODE"
    if [ $i -lt $MAX_RETRIES ]; then
        sleep $RETRY_DELAY
    fi
done

echo "[$(date)] FALLO: no se pudo contactar al backend tras $MAX_RETRIES intentos"
exit 1
