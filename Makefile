# ============================================================
# Hornero Project - Docker Makefile
# ============================================================

# Variables
BACKEND_DIR=backend
FRONTEND_DIR=frontend
DEV_MODE?=docker

.PHONY: help up down restart build logs ps clean run dev

# ------------------------------------------------------------
# 📚 Ayuda
# ------------------------------------------------------------
help:
	@echo ""
	@echo "Comandos disponibles:"
	@echo "  make build               Reconstruye las imágenes"
	@echo "  make run                 Levanta el sistema (backend en Docker)"
	@echo "  make run DEV_MODE=local  Levanta backend en Docker, frontend local (npm run dev)"
	@echo "  make dev                 Atajo para make run DEV_MODE=local"
	@echo "  make up                  Levanta backend y frontend en Docker"
	@echo "  make down                Detiene y elimina ambos entornos"
	@echo "  make restart             Reinicia ambos contenedores"
	@echo "  make logs                Muestra logs combinados"
	@echo "  make ps                  Lista los contenedores activos"
	@echo "  make clean               Elimina todos los contenedores e imágenes del proyecto"
	@echo ""

# ------------------------------------------------------------
# 🚀 Levantar entorno completo
# ------------------------------------------------------------
up:
	@echo "🟢 Levantando backend..."
	cd $(BACKEND_DIR) && docker-compose up -d
	@echo "🟢 Levantando frontend..."
	cd $(FRONTEND_DIR) && docker-compose up -d
	@echo "✅ Proyecto Hornero levantado con éxito"

# ------------------------------------------------------------
# 🛑 Detener entorno completo
# ------------------------------------------------------------
down:
	@echo "🛑 Deteniendo frontend..."
	cd $(FRONTEND_DIR) && docker-compose down
	@echo "🛑 Deteniendo backend..."
	cd $(BACKEND_DIR) && docker-compose down
	@echo "✅ Todo detenido"

# ------------------------------------------------------------
# 🔁 Reiniciar contenedores
# ------------------------------------------------------------
restart: down up

# ------------------------------------------------------------
# 🏗️ Reconstruir imágenes
# ------------------------------------------------------------
build:
	@echo "🏗️ Reconstruyendo backend..."
	cd $(BACKEND_DIR) && docker-compose build --no-cache
	@echo "🏗️ Reconstruyendo frontend..."
	cd $(FRONTEND_DIR) && docker-compose build --no-cache
	@echo "✅ Reconstrucción completa"

# ------------------------------------------------------------
# 📜 Ver logs combinados
# ------------------------------------------------------------
logs:
	@echo "📜 Mostrando logs de backend y frontend..."
	cd $(BACKEND_DIR) && docker-compose logs -f & \
	cd $(FRONTEND_DIR) && docker-compose logs -f

# ------------------------------------------------------------
# 🧩 Mostrar estado de los contenedores
# ------------------------------------------------------------
ps:
	cd $(BACKEND_DIR) && docker-compose ps
	cd $(FRONTEND_DIR) && docker-compose ps

# ------------------------------------------------------------
# 🧹 Limpiar entorno (contenedores + imágenes + volúmenes)
# ------------------------------------------------------------
clean:
	@echo "🧹 Limpiando entorno..."
	cd $(FRONTEND_DIR) && docker-compose down -v --rmi all --remove-orphans || true
	cd $(BACKEND_DIR) && docker-compose down -v --rmi all --remove-orphans || true
	@echo "✅ Limpieza completa"

# ------------------------------------------------------------
# 🚀 Ejecutar sistema (con opción de frontend local)
# ------------------------------------------------------------
run:
	@echo "🟢 Levantando backend..."
	cd $(BACKEND_DIR) && docker-compose up -d
ifeq ($(DEV_MODE),local)
	@echo "🟢 Levantando frontend en modo desarrollo local..."
	@echo "⚠️  Asegúrate de tener las dependencias instaladas (npm install)"
	cd $(FRONTEND_DIR) && npm run dev
else
	@echo "🟢 Levantando frontend en Docker..."
	cd $(FRONTEND_DIR) && docker-compose up -d
	@echo "✅ Proyecto Hornero levantado con éxito"
endif

# ------------------------------------------------------------
# 🛠️ Atajo para desarrollo local (frontend con npm run dev)
# ------------------------------------------------------------
dev:
	@$(MAKE) run DEV_MODE=local
