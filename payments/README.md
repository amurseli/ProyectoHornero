# Hornero Payments Service

Servicio de pagos para Proyecto Hornero. Gestiona la integración con MercadoPago para procesar donaciones.


## Configuración

### Variables de entorno requeridas:

```env
MP_ACCESS_TOKEN=TEST-1234567890-abcdef...
MP_PUBLIC_KEY=TEST-abc123...
DATABASE_URL=jdbc:postgresql://localhost:5432/hornero
DATABASE_USER=hornero
DATABASE_PASSWORD=hornero123
```

## Endpoints

### Health Check
```bash
# Basic
curl http://localhost:8081/

# Detallado
curl http://localhost:8081/api/health

# Actuator (Spring Boot)
curl http://localhost:8081/actuator/health
```

## Verificar que funciona

Después de levantar el servicio, deberías ver en los logs:

```
✅ MercadoPago SDK inicializado correctamente
🔑 Access Token: TEST-1234567890-abcd...
🌍 Ambiente: TEST
```

## Arquitectura

Este servicio es parte de un **monolito modular**:
- Comparte la misma DB que `backend` (por ahora)
- Corre como servicio independiente (puerto 8081)
- Comunicación con backend vía REST

