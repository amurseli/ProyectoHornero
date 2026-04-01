# ============================================================
# Hornero Project - Makefile
# ============================================================

BACKEND_DIR  = backend
FRONTEND_DIR = frontend
PAYMENTS_DIR = payments
NETWORK      = hornero-network

.PHONY: help network up down build logs dev \
        up-pay down-pay build-pay logs-pay \
        up-all down-all build-all \
        ps clean

# ------------------------------------------------------------
# Ayuda
# ------------------------------------------------------------
help:
	@echo ""
	@echo "  make dev          Backend en Docker, frontend local (npm run dev)"
	@echo "  make up           Levanta backend (postgres, redis, pgadmin, backend)"
	@echo "  make down         Detiene backend"
	@echo "  make build        Reconstruye backend"
	@echo "  make logs         Logs del backend"
	@echo ""
	@echo "  make up-pay       Levanta payments"
	@echo "  make down-pay     Detiene payments"
	@echo "  make build-pay    Reconstruye payments"
	@echo "  make logs-pay     Logs de payments"
	@echo ""
	@echo "  make up-all       Levanta todo (backend + payments)"
	@echo "  make down-all     Detiene todo"
	@echo "  make build-all    Reconstruye todo"
	@echo ""
	@echo "  make ps           Estado de contenedores"
	@echo "  make clean        Elimina contenedores, imágenes y volúmenes"
	@echo ""

# ------------------------------------------------------------
# Network compartida
# ------------------------------------------------------------
network:
	@docker network inspect $(NETWORK) >/dev/null 2>&1 || \
		(echo "Creando network $(NETWORK)..." && docker network create $(NETWORK))

# ------------------------------------------------------------
# Backend
# ------------------------------------------------------------
up: network
	cd $(BACKEND_DIR) && docker-compose up -d

down:
	cd $(BACKEND_DIR) && docker-compose down || true

build:
	cd $(BACKEND_DIR) && docker-compose build --no-cache

logs:
	cd $(BACKEND_DIR) && docker-compose logs -f

# ------------------------------------------------------------
# Payments
# ------------------------------------------------------------
up-pay: network
	cd $(PAYMENTS_DIR) && docker-compose up -d

down-pay:
	cd $(PAYMENTS_DIR) && docker-compose down || true

build-pay:
	cd $(PAYMENTS_DIR) && docker-compose build --no-cache

logs-pay:
	cd $(PAYMENTS_DIR) && docker-compose logs -f

# ------------------------------------------------------------
# Todo junto (testing local)
# ------------------------------------------------------------
up-all: up up-pay

down-all: down-pay down

build-all: build build-pay

# ------------------------------------------------------------
# Desarrollo (backend Docker, frontend local)
# ------------------------------------------------------------
dev: up
	@echo ""
	@echo "Backend corriendo. Iniciando frontend..."
	@echo ""
	cd $(FRONTEND_DIR) && npm run dev

# ------------------------------------------------------------
# Estado / Limpieza
# ------------------------------------------------------------
ps:
	@docker ps --filter "network=$(NETWORK)" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

clean:
	cd $(PAYMENTS_DIR) && docker-compose down -v --rmi all --remove-orphans || true
	cd $(BACKEND_DIR) && docker-compose down -v --rmi all --remove-orphans || true
	docker network rm $(NETWORK) || true

restart: down build up

restart-pay: down-pay build-pay up-pay

restart-all: down-all build-all up-all