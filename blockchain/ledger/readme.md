Para compilar el smart contract en solidity

1. brew install solidity o equivalente en otro SO

2. Correr:

solc \
  --abi \
  --bin \
  contracts/HorneroLedger.sol \
  -o src/main/resources/contracts \
  --overwrite
