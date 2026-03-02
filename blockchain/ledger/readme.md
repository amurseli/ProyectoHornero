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




Con el siguiente comando deployé el contrato a mano

mvn -f ledger/pom.xml clean compile exec:java -Dexec.mainClass=com.hornero.blockchain.DeployContract -Dexec.classpathScope=compile

Y con el siguiente deployé una transacción

mvn -f ledger/pom.xml compile exec:java -Dexec.mainClass=com.hornero.blockchain.RegisterTransaction -Dexec.classpathScope=compile

Register TX hash: 0x353ec5b48f96eb24c003443acd1562d7a5fd58d75ee39dc374bdb0e0f703902d
Register status: 0x1
Block number: 34678920

En ambos casos toma los datos del .env