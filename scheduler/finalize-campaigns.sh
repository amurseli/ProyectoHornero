#!/bin/sh
MAX_RETRIES=3
RETRY_DELAY=60

call_endpoint() {
    LABEL=$1
    URL=$2

    echo "[$(date)] Iniciando $LABEL..."

    for i in $(seq 1 $MAX_RETRIES); do
        HTTP_CODE=$(curl -s -o /tmp/response.json -w "%{http_code}" \
            -X POST "$URL" \
            -H "X-Service-Key: ${SERVICE_KEY}" \
            -H "Content-Type: application/json" \
            --connect-timeout 10 \
            --max-time 60)

        if [ "$HTTP_CODE" = "200" ]; then
            echo "[$(date)] $LABEL OK - $(cat /tmp/response.json)"
            return 0
        fi

        echo "[$(date)] $LABEL - Intento $i/$MAX_RETRIES fallido - HTTP $HTTP_CODE"
        if [ $i -lt $MAX_RETRIES ]; then
            sleep $RETRY_DELAY
        fi
    done

    echo "[$(date)] $LABEL FALLO: no se pudo contactar al backend tras $MAX_RETRIES intentos"
    return 1
}

call_endpoint "limpieza de contribuciones" "${BACKEND_URL}/internal/cleanup-contributions"
call_endpoint "finalizacion de campanas" "${BACKEND_URL}/internal/finalize-campaigns"
