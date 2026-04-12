# Proyecto Hornero Blockchain

El proyecto quedó separado en dos microservicios Spring Boot:

- `api-gateway`: expone la API pública.
- `ledger-service`: firma y publica la transacción en Polygon usando la wallet y el contrato configurados.

Solo `api-gateway` queda publicado hacia afuera. `ledger-service` vive en la red interna de Docker.

## Endpoint público

`POST /api/v1/transactions`

Body:

```json
{
  "emisor": "proveedor-001",
  "receptor": "cliente-002",
  "amount": 1000,
  "referencia": "factura-0001"
}
```

También acepta `reference` en lugar de `referencia`.

Respuesta:

```json
{
  "ok": true,
  "txHash": "0x...",
  "explorerUrl": "https://amoy.polygonscan.com/tx/0x...",
  "contractAddress": "0x..."
}
```

## Levantar con Docker

Completar `ledger/.env` con al menos:

- `POLYGON_RPC_URL`
- `PRIVATE_KEY`
- `CONTRACT_ADDRESS`

Luego:

```bash
docker compose up --build
```

La API pública queda en:

```text
http://localhost:8080/api/v1/transactions
```

## Probar el endpoint

```bash
curl --request POST http://localhost:8080/api/v1/transactions \
  --header 'Content-Type: application/json' \
  --data '{
    "emisor": "proveedor-001",
    "receptor": "cliente-002",
    "amount": 1000,
    "referencia": "factura-0001"
  }'
```

## Ejecución local sin Docker

Servicio blockchain:

```bash
mvn -f ledger/pom.xml spring-boot:run
```

Gateway:

```bash
mvn -f api-gateway/pom.xml spring-boot:run
```
