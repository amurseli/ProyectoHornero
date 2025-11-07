# ============================================================
# Hornero Project - Docker Makefile
# ============================================================

# Variables
BACKEND_DIR=backend
FRONTEND_DIR=frontend

.PHONY: help up down restart build logs ps clean

# ------------------------------------------------------------
# 📚 Ayuda
# ------------------------------------------------------------
help:
	@echo ""
	@echo "Comandos disponibles:"
	@echo "  make up         Levanta backend y frontend (en ese orden)"
	@echo "  make down       Detiene y elimina ambos entornos"
	@echo "  make restart    Reinicia ambos contenedores"
	@echo "  make build      Reconstruye las imágenes"
	@echo "  make logs       Muestra logs combinados"
	@echo "  make ps         Lista los contenedores activos"
	@echo "  make clean      Elimina todos los contenedores e imágenes del proyecto"
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
