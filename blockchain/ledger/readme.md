## CORRER LOCAL EN LAMBDA

mvn -f ledger/pom.xml compile exec:java \
  -Dexec.mainClass="com.hornero.blockchain.LocalLambdaInvoke" \
  -Dexec.args="ledger/events/register-transaction-event.json"




## 1) Compilar contrato Solidity

1. Instalar `solc` (`brew install solidity` o equivalente).
2. Desde `ledger/`, correr:

```bash
solc \
  --abi \
  --bin \
  contracts/HorneroLedger.sol \
  -o src/main/resources/contracts \
  --overwrite
```

## 2) Configuración de claves y datos

Crear `ledger/.env` copiando `ledger/.env.example` y completar:

- `POLYGON_RPC_URL`: URL RPC (Alchemy/Infura, preferible Amoy para pruebas).
- `POLYGON_CHAIN_ID`: opcional (Amoy `80002`, Mainnet `137`). Si no se define, se infiere por URL.
- `POLYGON_MIN_GAS_PRICE_GWEI`: mínimo de gas price a usar (default `25`).
- `POLYGON_GAS_PRICE_GWEI`: opcional para forzar un valor fijo.
- `POLYGON_MAX_GAS_PRICE_GWEI`: opcional para limitar un techo y evitar spikes del nodo.
- `POLYGON_GAS_LIMIT`: opcional (default `500000`).
- `PRIVATE_KEY`: clave privada de la wallet que firma.
- `CONTRACT_ADDRESS`: dirección del contrato desplegado (solo para registrar sin redeploy).
- `TX_EMISOR`, `TX_RECEPTOR`, `TX_AMOUNT`, `TX_REFERENCE`: datos del registro.

Nota: aunque sea un registro de datos (no transferencia), cada transacción paga gas en MATIC.

## 3) Ejecutar

### Deploy del contrato

```bash
mvn -f ledger/pom.xml exec:java -Dexec.mainClass="com.hornero.blockchain.DeployContract"
```

### Registrar transacción usando contrato existente

```bash
mvn -f ledger/pom.xml exec:java -Dexec.mainClass="com.hornero.blockchain.RegisterTransaction"
```

También podés pasar argumentos:

```bash
mvn -f ledger/pom.xml exec:java \
  -Dexec.mainClass="com.hornero.blockchain.RegisterTransaction" \
  -Dexec.args="0xCONTRACT emisor receptor 1000 factura-0001"
```

### Flujo end-to-end (deploy + register)

```bash
mvn -f ledger/pom.xml exec:java -Dexec.mainClass="com.hornero.blockchain.EndToEndFlow"
```

## 4) Ejecutar en AWS Lambda (API Gateway)

### Build del artefacto para Lambda

```bash
mvn -f ledger/pom.xml clean package
```

Subir `ledger/target/ledger-1.0-SNAPSHOT-all.jar` como código de la función Lambda.

### Handler

Configurar el handler como:

```text
com.hornero.blockchain.RegisterTransactionLambdaHandler
```

### Variables de entorno en Lambda

Definir al menos:

- `POLYGON_RPC_URL`
- `PRIVATE_KEY`
- `CONTRACT_ADDRESS` (si no lo enviás en el body)

Opcionales:

- `POLYGON_CHAIN_ID`
- `POLYGON_MIN_GAS_PRICE_GWEI`
- `POLYGON_GAS_PRICE_GWEI`
- `POLYGON_MAX_GAS_PRICE_GWEI`
- `POLYGON_GAS_LIMIT`
- `TX_REFERENCE`
- `LAMBDA_DEBUG_ERRORS` (`true` para incluir `cause` en errores `500`)

### Body esperado del POST

```json
{
  "contractAddress": "0x...",
  "emisor": "emisor-001",
  "receptor": "receptor-001",
  "amount": "1000",
  "reference": "factura-0001"
}
```

`contractAddress` es opcional si está en variable de entorno (`CONTRACT_ADDRESS`).
`reference` es opcional (usa `TX_REFERENCE` o `"sin-referencia"`).

Respuesta exitosa:

```json
{
  "ok": true,
  "txHash": "0x...",
  "contractAddress": "0x..."
}
```

Errores de validación devuelven `400`; errores internos `500`.

### Test local del handler (sin AWS)

Editar `ledger/events/register-transaction-event.json` con tus valores y ejecutar:

```bash
mvn -f ledger/pom.xml compile exec:java \
  -Dexec.mainClass="com.hornero.blockchain.LocalLambdaInvoke" \
  -Dexec.args="ledger/events/register-transaction-event.json"
```

Esto invoca localmente `RegisterTransactionLambdaHandler` con un evento estilo Lambda y muestra el response JSON.
Además, imprime diagnóstico de costo antes de enviar la transacción:

- `gasPriceWei` (y aproximación en gwei)
- `gasLimit`
- `maxTxCostWei` (costo máximo estimado en MATIC)
- `balanceWei` de la wallet




Con el siguiente comando deployé el contrato a mano

mvn -f ledger/pom.xml clean compile exec:java -Dexec.mainClass=com.hornero.blockchain.DeployContract -Dexec.classpathScope=compile

Y con el siguiente deployé una transacción

mvn -f ledger/pom.xml compile exec:java -Dexec.mainClass=com.hornero.blockchain.RegisterTransaction -Dexec.classpathScope=compile

Register TX hash: 0x353ec5b48f96eb24c003443acd1562d7a5fd58d75ee39dc374bdb0e0f703902d
Register status: 0x1
Block number: 34678920

En ambos casos toma los datos del .env
