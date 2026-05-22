# 🦅 Proyecto Hornero - Entorno Docker

Este proyecto utiliza **Docker Compose** para levantar el backend y el frontend de forma independiente, pero coordinada.  
El Makefile simplifica todas las operaciones habituales para desarrollo.

---

## 🚀 Requisitos previos

- [Docker](https://www.docker.com/) y [Docker Compose](https://docs.docker.com/compose/) instalados.
- Acceso a las carpetas:
/backend
/frontend
Cada una con su propio `docker-compose.yml`.

---

## ⚙️ Comandos principales

Desde la raíz del proyecto, podés ejecutar:

| Comando | Descripción |
|----------|--------------|
| `make up` | Levanta **backend** y luego **frontend** |
| `make down` | Detiene ambos contenedores |
| `make restart` | Reinicia todo el entorno |
| `make build` | Reconstruye imágenes sin caché |
| `make logs` | Muestra logs combinados de ambos servicios |
| `make ps` | Lista los contenedores activos |
| `make clean` | Elimina contenedores, imágenes y volúmenes |

---

## 🧩 Ejemplo de uso

```bash
# Levantar todo el entorno
make up

# Ver contenedores activos
make ps

# Ver logs del backend y frontend
make logs

# Apagar todo
make down
```


## PG ADMIN

Te logueas en http://localhost:5050

admin@admin.com
admin

Y agregás un servidor nuevo

| Campo                    | Valor        |
| ------------------------ | ------------ |
| **Host name/address**    | `postgres`   |
| **Port**                 | `5432`       |
| **Maintenance database** | `hornero`    |
| **Username**             | `hornero`    |
| **Password**             | `hornero123` |

Prueba deploy

## S3 namespace por entorno

Para evitar mezclar uploads entre producción y bases locales de distintos desarrolladores, todas las claves S3 se guardan bajo un prefijo raíz.

Variables relevantes en `backend/.env.backend`:

| Variable | Ejemplo | Uso |
| --- | --- | --- |
| `AWS_S3_ROOT_PREFIX` | `production` o `test-mateo` | Prefijo raíz explícito dentro del bucket |
| `APP_ENVIRONMENT` | `production` o `local` | Si no definís prefijo explícito, `production` genera `production/` |
| `APP_INSTANCE_ID` | `mateo-mac` | En local genera `test-mateo-mac/` |

Recomendación:

- Producción: `AWS_S3_ROOT_PREFIX=production`
- Cada entorno local: `AWS_S3_ROOT_PREFIX=test-tu-nombre` o `APP_INSTANCE_ID=tu-nombre`

Ejemplo de estructura resultante:

```text
production/media/campaign-12/....
production/identity-docs/34/....
test-mateo/recompensa/campaign-7/....
test-ana/equipo/campaign-7/....
```
