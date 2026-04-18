# Hornero Blockchain

Este repositorio queda reducido a un unico servicio:

- `ledger-service`: microservicio Spring Boot que registra transacciones en Polygon y expone una API HTTP.

## Levantar con Docker

1. Completa `ledger/.env` con estas variables obligatorias:

```env
POLYGON_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/TU_API_KEY
PRIVATE_KEY=tu-private-key
CONTRACT_ADDRESS=0xTuContrato
```

Variables opcionales:

```env
POLYGON_CHAIN_ID=80002
POLYGON_MIN_GAS_PRICE_GWEI=25
POLYGON_MAX_GAS_PRICE_GWEI=100
POLYGON_GAS_LIMIT=500000
TX_REFERENCE=sin-referencia
```

2. Levanta el servicio desde la raiz del repo:

```bash
docker compose up --build
```

La API queda disponible en `http://localhost:8080`.

## Endpoints

### `POST /api/v1/transactions`

Registra una transaccion en el contrato configurado.

Request:

```json
{
  "emisor": "proveedor-001",
  "receptor": "cliente-002",
  "amount": 1000,
  "reference": "factura-0001"
}
```

Notas:

- `reference` tambien puede enviarse como `referencia`.
- `amount` debe ser un numero entero positivo.
- `emisor`, `receptor` y `reference` son obligatorios.

Respuesta exitosa (`201 Created`):

```json
{
  "ok": true,
  "txHash": "0x...",
  "contractAddress": "0x...",
  "explorerUrl": "https://amoy.polygonscan.com/tx/0x..."
}
```

Error de validacion o configuracion (`400 Bad Request`):

```json
{
  "ok": false,
  "error": "reference must not be blank"
}
```

Error interno al publicar en blockchain (`500 Internal Server Error`):

```json
{
  "ok": false,
  "error": "Internal error while registering transaction"
}
```

Ejemplo con `curl`:

```bash
curl --request POST http://localhost:8080/api/v1/transactions \
  --header 'Content-Type: application/json' \
  --data '{
    "emisor": "proveedor-001",
    "receptor": "cliente-002",
    "amount": 1000,
    "reference": "factura-0001"
  }'
```

### `GET /actuator/health`

Chequeo basico de salud del servicio.

Respuesta esperada:

```json
{
  "status": "UP"
}
```
