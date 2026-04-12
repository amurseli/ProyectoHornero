# AWS Deploy with CDK

Esta carpeta reemplaza la infraestructura de Terraform por AWS CDK en TypeScript.

## Arquitectura

Se crean estos recursos:

- 1 VPC pública sin NAT
- 1 ECS Cluster
- 1 repositorio ECR
- 1 servicio ECS Fargate
- 1 Application Load Balancer público
- CloudWatch Logs

Flujo:

```text
Internet
  |
  v
ALB público
  |
  v
ledger-service
  |
  v
Polygon RPC
```

## Prerrequisitos

- AWS CLI autenticado con la cuenta correcta
- Node.js 20 o superior
- npm instalado
- Docker instalado

## 1. Instalar dependencias

```bash
cd infra/cdk
npm install
```

## 2. Bootstrap de CDK

La primera vez en una cuenta/región hay que bootstrapear CDK:

```bash
AWS_PROFILE=hornero CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --profile hornero --query Account --output text) \
CDK_DEFAULT_REGION=us-east-1 \
npx cdk bootstrap aws://$CDK_DEFAULT_ACCOUNT/$CDK_DEFAULT_REGION
```

Si tu shell no expande bien esa línea, hacelo en pasos:

```bash
export AWS_PROFILE=hornero
export CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --profile hornero --query Account --output text)
export CDK_DEFAULT_REGION=us-east-1
npx cdk bootstrap aws://$CDK_DEFAULT_ACCOUNT/$CDK_DEFAULT_REGION
```

## 3. Deploy inicial de infraestructura

El deploy inicial crea ECR, ECS, ALB y el resto. Se hace con el servicio en `0` tasks para que primero exista el repositorio donde vas a subir la imagen.

```bash
export AWS_PROFILE=hornero
export CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --profile hornero --query Account --output text)
export CDK_DEFAULT_REGION=us-east-1

npx cdk deploy \
  --parameters ProjectName=hornero \
  --parameters EnvironmentName=prod \
  --parameters LedgerServiceDesiredCount=0 \
  --parameters LedgerServiceImageTag=latest \
  --parameters PolygonRpcUrl='https://polygon-amoy.g.alchemy.com/v2/replace-me' \
  --parameters ContractAddress='0xreplace-me' \
  --parameters PrivateKey='replace-me' \
  --parameters PolygonChainId=80002
```

## 4. Obtener las URLs de ECR

```bash
aws cloudformation describe-stacks \
  --profile hornero \
  --region us-east-1 \
  --stack-name HorneroInfraStack \
  --query "Stacks[0].Outputs[?OutputKey=='LedgerServiceRepositoryUri'].[OutputKey,OutputValue]" \
  --output table
```

## 5. Login a ECR

```bash
aws ecr get-login-password --profile hornero --region us-east-1 | docker login --username AWS --password-stdin <tu-account-id>.dkr.ecr.us-east-1.amazonaws.com
```

## 6. Build y push de imágenes

Desde la raíz del repo:

```bash
docker build -t hornero-ledger-service:latest ./ledger
docker tag hornero-ledger-service:latest <ledger_service_repository_uri>:latest
docker push <ledger_service_repository_uri>:latest
```

## 7. Activar los servicios

Una vez subidas las imágenes, desplegá otra vez con `desiredCount=1`:

```bash
npx cdk deploy \
  --parameters ProjectName=hornero \
  --parameters EnvironmentName=prod \
  --parameters LedgerServiceDesiredCount=1 \
  --parameters LedgerServiceImageTag=latest \
  --parameters PolygonRpcUrl='https://polygon-amoy.g.alchemy.com/v2/replace-me' \
  --parameters ContractAddress='0xreplace-me' \
  --parameters PrivateKey='replace-me' \
  --parameters PolygonChainId=80002
```

## 8. Obtener el endpoint público

```bash
aws cloudformation describe-stacks \
  --profile hornero \
  --region us-east-1 \
  --stack-name HorneroInfraStack \
  --query "Stacks[0].Outputs[?OutputKey=='TransactionsEndpoint'].OutputValue" \
  --output text
```

## 9. Probar

```bash
curl --request POST http://<alb-dns>/api/v1/transactions \
  --header 'Content-Type: application/json' \
  --data '{
    "emisor": "proveedor-001",
    "receptor": "cliente-002",
    "amount": 1000,
    "referencia": "factura-0001"
  }'
```

## Notas importantes

- En esta primera versión, `PRIVATE_KEY` y `POLYGON_RPC_URL` viajan como parámetros del stack. Funciona, pero no es la opción más segura.
- El siguiente paso razonable es mover esos valores a AWS Secrets Manager y hacer que ECS los consuma como secretos.
- Si cambiás código y querés redeployar, subí una nueva imagen con otro tag y volvé a ejecutar `cdk deploy` cambiando `LedgerServiceImageTag`.
