# ============================================================
# Hornero Project - Makefile
# ============================================================

# Variables
COMPOSE := docker-compose
FRONTEND_DIR := frontend
SERVICES_ALL := backend payments postgres
SERVICES_DEV := backend payments postgres

.PHONY: help up down restart build logs logs-backend logs-payments ps clean dev

# ------------------------------------------------------------
# 📚 Ayuda
# ------------------------------------------------------------
help:
	@echo ""
	@echo "Comandos disponibles:"
	@echo "  make up                  Levanta todo (backend + payments + postgres)"
	@echo "  make down                Detiene y elimina todos los contenedores"
	@echo "  make restart             Reinicia todos los servicios"
	@echo "  make build               Reconstruye las imágenes"
	@echo "  make logs                Muestra logs de todos los servicios"
	@echo "  make logs-backend        Logs solo del backend"
	@echo "  make logs-payments       Logs solo del servicio de pagos"
	@echo "  make ps                  Lista los contenedores activos"
	@echo "  make clean               Elimina contenedores, imágenes y volúmenes"
	@echo "  make dev                 Levanta backend + payments (frontend en local)"
	@echo ""

# ------------------------------------------------------------
# 🚀 Levantar entorno completo
# ------------------------------------------------------------
up:
	@echo "🟢 Levantando Proyecto Hornero..."
	$(COMPOSE) up -d
	@echo "🟢 Levantando frontend..."
	cd $(FRONTEND_DIR) && $(COMPOSE) up -d
	@echo "✅ Proyecto levantado con éxito"
	@echo ""
	@echo "📡 Servicios disponibles:"
	@echo "  Frontend: http://localhost:5173"
	@echo "  Backend:  http://localhost:8080"
	@echo "  Payments: http://localhost:8081"
	@echo "  Postgres: localhost:5432"
	@echo ""

# ------------------------------------------------------------
# 🛑 Detener entorno completo
# ------------------------------------------------------------
down:
	@echo "🛑 Deteniendo frontend..."
	cd $(FRONTEND_DIR) && $(COMPOSE) down
	@echo "🛑 Deteniendo servicios..."
	$(COMPOSE) down
	@echo "✅ Servicios detenidos"

# ------------------------------------------------------------
# 🔄 Reiniciar contenedores
# ------------------------------------------------------------
restart: down up

# ------------------------------------------------------------
# 🏗️ Reconstruir imágenes
# ------------------------------------------------------------
build:
	@echo "🏗️ Reconstruyendo imágenes..."
	$(COMPOSE) build --no-cache
	@echo "🏗️ Reconstruyendo frontend..."
	cd $(FRONTEND_DIR) && $(COMPOSE) build --no-cache
	@echo "✅ Reconstrucción completa"

# ------------------------------------------------------------
# 📜 Ver logs
# ------------------------------------------------------------
logs:
	$(COMPOSE) logs -f

logs-backend:
	$(COMPOSE) logs -f backend

logs-payments:
	$(COMPOSE) logs -f payments

# ------------------------------------------------------------
# 🧩 Mostrar estado de los contenedores
# ------------------------------------------------------------
ps:
	$(COMPOSE) ps
	cd $(FRONTEND_DIR) && $(COMPOSE) ps

# ------------------------------------------------------------
# 🧹 Limpiar entorno (contenedores + imágenes + volúmenes)
# ------------------------------------------------------------
clean:
	@echo "🧹 Limpiando entorno..."
	cd $(FRONTEND_DIR) && $(COMPOSE) down -v --rmi all --remove-orphans || true
	$(COMPOSE) down -v --rmi all --remove-orphans || true
	@echo "✅ Limpieza completa"

# ------------------------------------------------------------
# 🛠️ Desarrollo (backend + payments en Docker, frontend local)
# ------------------------------------------------------------
dev:
	@echo "🟢 Modo desarrollo: backend + payments en Docker"
	$(COMPOSE) up -d $(SERVICES_DEV)
	@echo ""
	@echo "✅ Backend y Payments corriendo en Docker"
	@echo "⚠️  Recordá correr el frontend localmente:"
	@echo "     cd frontend && npm run dev"
	@echo ""
	@echo "📡 Servicios:"
	@echo "  Backend:  http://localhost:8080"
	@echo "  Payments: http://localhost:8081"
	@echo ""