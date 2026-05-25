# ============================================================
# Hornero Project - Makefile
# ============================================================

BACKEND_DIR    = backend
FRONTEND_DIR   = frontend
BACKOFFICE_DIR = backoffice
PAYMENTS_DIR   = payments
SCHEDULER_DIR  = scheduler
BLOCKCHAIN_DIR = blockchain
NETWORK        = hornero-network

ifeq ($(OS),Windows_NT)
    DEVNULL := NUL
else
    DEVNULL := /dev/null
endif

.PHONY: help network up down build logs dev \
        up-bo down-bo build-bo logs-bo \
        up-backoffice down-backoffice build-backoffice logs-backoffice \
        up-bo-prod down-bo-prod build-bo-prod \
        up-pay down-pay build-pay logs-pay \
        up-chain down-chain build-chain logs-chain \
        up-sched down-sched build-sched logs-sched \
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
	@echo "  make up-bo        Levanta backoffice (dev, HMR)"
	@echo "  make up-backoffice Alias de up-bo"
	@echo "  make down-bo      Detiene backoffice"
	@echo "  make down-backoffice Alias de down-bo"
	@echo "  make build-bo     Reconstruye backoffice"
	@echo "  make build-backoffice Alias de build-bo"
	@echo "  make logs-bo      Logs del backoffice"
	@echo "  make logs-backoffice Alias de logs-bo"
	@echo ""
	@echo "  make up-pay       Levanta payments"
	@echo "  make down-pay     Detiene payments"
	@echo "  make build-pay    Reconstruye payments"
	@echo "  make logs-pay     Logs de payments"
	@echo ""
	@echo "  make up-chain     Levanta blockchain"
	@echo "  make down-chain   Detiene blockchain"
	@echo "  make build-chain  Reconstruye blockchain"
	@echo "  make logs-chain   Logs de blockchain"
	@echo ""
	@echo "  make up-sched     Levanta scheduler"
	@echo "  make down-sched   Detiene scheduler"
	@echo "  make build-sched  Reconstruye scheduler (rapido, Alpine+curl)"
	@echo "  make logs-sched   Logs del scheduler"
	@echo ""
	@echo "  make up-all       Levanta todo (backend + frontend + backoffice + payments + blockchain + scheduler)"
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
	@docker network inspect $(NETWORK) >$(DEVNULL) 2>&1 || \
		(echo "Creando network $(NETWORK)..." && docker network create $(NETWORK) >$(DEVNULL) 2>&1) || \
		true

# ------------------------------------------------------------
# Backend + frontend (dev por defecto, con HMR)
# ------------------------------------------------------------
up: network
	cd $(BACKEND_DIR) && docker-compose up -d --build
	cd $(FRONTEND_DIR) && docker-compose -f docker-compose.dev.yml up -d

down:
	cd $(BACKEND_DIR) && docker-compose down || true
	cd $(FRONTEND_DIR) && docker-compose -f docker-compose.dev.yml down || true
	cd $(FRONTEND_DIR) && docker-compose down || true

build:
	cd $(BACKEND_DIR) && docker-compose build
	cd $(FRONTEND_DIR) && docker-compose -f docker-compose.dev.yml build

logs:
	cd $(BACKEND_DIR) && docker-compose logs -f

# ------------------------------------------------------------
# Frontend modo prod (nginx, build estático) — solo para testear deploy
# ------------------------------------------------------------
up-prod: network
	cd $(BACKEND_DIR) && docker-compose up -d --build
	cd $(FRONTEND_DIR) && docker-compose up -d

down-prod:
	cd $(BACKEND_DIR) && docker-compose down || true
	cd $(FRONTEND_DIR) && docker-compose down || true

build-prod:
	cd $(BACKEND_DIR) && docker-compose build
	cd $(FRONTEND_DIR) && docker-compose build

# ------------------------------------------------------------
# Backoffice (dev por defecto, con HMR)
# ------------------------------------------------------------
up-bo: network
	cd $(BACKOFFICE_DIR) && docker-compose -f docker-compose.dev.yml up -d

up-backoffice: up-bo

down-bo:
	cd $(BACKOFFICE_DIR) && docker-compose -f docker-compose.dev.yml down || true
	cd $(BACKOFFICE_DIR) && docker-compose down || true

down-backoffice: down-bo

build-bo:
	cd $(BACKOFFICE_DIR) && docker-compose -f docker-compose.dev.yml build

build-backoffice: build-bo

logs-bo:
	cd $(BACKOFFICE_DIR) && docker-compose -f docker-compose.dev.yml logs -f

logs-backoffice: logs-bo

# ------------------------------------------------------------
# Backoffice modo prod (nginx, build estático) — puerto 3001
# ------------------------------------------------------------
up-bo-prod: network
	cd $(BACKOFFICE_DIR) && docker-compose up -d

down-bo-prod:
	cd $(BACKOFFICE_DIR) && docker-compose down || true

build-bo-prod:
	cd $(BACKOFFICE_DIR) && docker-compose build

# ------------------------------------------------------------
# Payments
# ------------------------------------------------------------
up-pay: network
	cd $(PAYMENTS_DIR) && docker-compose up -d --build

down-pay:
	cd $(PAYMENTS_DIR) && docker-compose down || true

build-pay:
	cd $(PAYMENTS_DIR) && docker-compose build

logs-pay:
	cd $(PAYMENTS_DIR) && docker-compose logs -f

# ------------------------------------------------------------
# Blockchain
# ------------------------------------------------------------
up-chain: network
	cd $(BLOCKCHAIN_DIR) && docker-compose -f compose.yaml up -d --build

down-chain:
	cd $(BLOCKCHAIN_DIR) && docker-compose -f compose.yaml down || true

build-chain:
	cd $(BLOCKCHAIN_DIR) && docker-compose -f compose.yaml build

logs-chain:
	cd $(BLOCKCHAIN_DIR) && docker-compose -f compose.yaml logs -f

# ------------------------------------------------------------
# Scheduler
# ------------------------------------------------------------
up-sched: network
	cd $(SCHEDULER_DIR) && docker-compose up -d

down-sched:
	cd $(SCHEDULER_DIR) && docker-compose down || true

build-sched:
	cd $(SCHEDULER_DIR) && docker-compose build

logs-sched:
	cd $(SCHEDULER_DIR) && docker-compose logs -f

# ------------------------------------------------------------
# Todo junto (testing local)
# ------------------------------------------------------------
up-all: up up-bo up-pay up-chain up-sched

down-all: down-sched down-chain down-pay down-bo down

build-all: build build-bo build-pay build-chain build-sched

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
	cd $(SCHEDULER_DIR) && docker-compose down -v --rmi all --remove-orphans || true
	cd $(BLOCKCHAIN_DIR) && docker-compose -f compose.yaml down -v --rmi all --remove-orphans || true
	cd $(PAYMENTS_DIR) && docker-compose down -v --rmi all --remove-orphans || true
	cd $(BACKEND_DIR) && docker-compose down -v --rmi all --remove-orphans || true
	docker network rm $(NETWORK) || true

restart: down build up

restart-pay: down-pay build-pay up-pay

restart-all: down-all build-all up-all
