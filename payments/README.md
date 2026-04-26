# Hornero Payments Service

Servicio de pagos para Proyecto Hornero. Gestiona la integración con MercadoPago para procesar donaciones.


## Configuración

### Variables de entorno requeridas:

```env
MP_ACCESS_TOKEN=TEST-1234567890-abcdef...
MP_PUBLIC_KEY=TEST-abc123...
DATABASE_URL=jdbc:postgresql://localhost:5432/hornero
DATABASE_USER=hornero
DATABASE_PASSWORD=...
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

## Tarjetas de prueba (MercadoPago Sandbox)

El email del pagador puede ser cualquiera,  **excepto leticia.isabel.aab@gmail.com**

El resultado del pago se controla con el **nombre del titular** de la tarjeta.

### Tarjetas disponibles

| Marca | Número | Tipo |
|-------|--------|------|
| Visa | `4509 9535 6623 3704` | Crédito |
| Mastercard | `5031 7557 3453 0604` | Crédito |
| American Express | `3711 803032 57522` | Crédito |
| Visa Débito | `4023 3010 0000 0005` | Débito |

- Vencimiento: cualquier fecha futura (ej: `11/30`)
- CVV: `123` (Amex: `1234`)

### Resultados según nombre del titular

| Nombre titular | Resultado |
|----------------|-----------|
| `APRO` | Pago aprobado |
| `OTHE` | Rechazado por error general |
| `CONT` | Pago pendiente |
| `CALL` | Rechazado, llamar para autorizar |
| `FUND` | Rechazado por fondos insuficientes |
| `SECU` | Rechazado por código de seguridad |
| `EXPI` | Rechazado por fecha de vencimiento |
| `FORM` | Rechazado por error en formulario |

## Arquitectura

Este servicio es parte de un **monolito modular**:
- Comparte la misma DB que `backend` (por ahora)
- Corre como servicio independiente (puerto 8081)
- Comunicación con backend vía REST

