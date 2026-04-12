# Ledger Service

Este servicio expone un endpoint HTTP para registrar una transacción en Polygon y devolver el `txHash` para consultarla en PolygonScan.

La forma recomendada de correrlo es siempre con Docker.

## Flujo rápido con Docker

### 1. Completar `ledger/.env`

Antes de levantar el contenedor, asegurate de tener definido al menos:

- `POLYGON_RPC_URL`
- `PRIVATE_KEY`
- `CONTRACT_ADDRESS`

Opcionales pero recomendados:

- `POLYGON_CHAIN_ID`
- `POLYGON_MIN_GAS_PRICE_GWEI`
- `POLYGON_MAX_GAS_PRICE_GWEI`
- `POLYGON_GAS_LIMIT`
- `TX_REFERENCE`

Ejemplo de valores relevantes:

```env
POLYGON_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/tu-api-key
POLYGON_CHAIN_ID=80002
PRIVATE_KEY=tu-private-key
CONTRACT_ADDRESS=0xTuContrato
POLYGON_MIN_GAS_PRICE_GWEI=25
POLYGON_MAX_GAS_PRICE_GWEI=100
POLYGON_GAS_LIMIT=500000
TX_REFERENCE=sin-referencia
```

## 2. Levantar el servicio

Desde la raíz del repo:

```bash
docker compose up --build
```

El servicio queda expuesto en:

```text
http://localhost:8080
```

## 3. Probar el endpoint

Endpoint:

```text
POST /api/v1/transactions
```

Ejemplo:

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

También acepta `reference` en lugar de `referencia`.

Respuesta esperada:

```json
{
  "ok": true,
  "txHash": "0x...",
  "contractAddress": "0x...",
  "explorerUrl": "https://amoy.polygonscan.com/tx/0x..."
}
```

## 4. Qué hace internamente

El servicio:

- toma `emisor`, `receptor`, `amount` y `referencia`
- firma la transacción con la wallet configurada en `PRIVATE_KEY`
- llama al contrato configurado en `CONTRACT_ADDRESS`
- devuelve el `txHash` y la URL del explorer

## Problemas comunes

- Si falta `POLYGON_RPC_URL`, `PRIVATE_KEY` o `CONTRACT_ADDRESS`, el servicio no va a poder registrar la transacción.
- Si la wallet no tiene MATIC para gas, la operación va a fallar.
- Si el `CONTRACT_ADDRESS` no corresponde al contrato esperado, la llamada puede revertir.

## Referencia técnica

### Compilar contrato Solidity

Si cambiás el contrato:

1. instalá `solc`
2. desde `ledger/` corré:

```bash
solc \
  --abi \
  --bin \
  contracts/HorneroLedger.sol \
  -o src/main/resources/contracts \
  --overwrite
```

Si cambia la firma del contrato, tenés que recompilar, redeployar y actualizar `CONTRACT_ADDRESS`.

### Ejecutar sin Docker

No es el flujo recomendado, pero existe:

```bash
mvn -f ledger/pom.xml spring-boot:run
```

### Comandos Java heredados

Deploy del contrato:

```bash
mvn -f ledger/pom.xml exec:java -Dexec.mainClass="com.hornero.blockchain.DeployContract"
```

Registrar una transacción:

```bash
mvn -f ledger/pom.xml exec:java -Dexec.mainClass="com.hornero.blockchain.RegisterTransaction"
```

Flujo end-to-end:

```bash
mvn -f ledger/pom.xml exec:java -Dexec.mainClass="com.hornero.blockchain.EndToEndFlow"
```

### Soporte legado Lambda

Todavía existe el handler:

```text
com.hornero.blockchain.RegisterTransactionLambdaHandler
```

Y se puede probar localmente con:

```bash
mvn -f ledger/pom.xml compile exec:java \
  -Dexec.mainClass="com.hornero.blockchain.LocalLambdaInvoke" \
  -Dexec.args="ledger/events/register-transaction-event.json"
```
