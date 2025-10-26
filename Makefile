.PHONY: help build up down restart logs ps clean setup

help:
	@echo "Comandos disponibles:"
	@echo "  make setup      - Setup inicial (build + migrate)"
	@echo "  make build      - Construir todas las imágenes"
	@echo "  make up         - Levantar todos los servicios"
	@echo "  make down       - Bajar todos los servicios"
	@echo "  make restart    - Reiniciar todos los servicios"
	@echo "  make logs       - Ver logs de todos los servicios"
	@echo "  make ps         - Ver estado de los servicios"
	@echo "  make clean      - Limpiar containers y volúmenes"
	@echo ""
	@echo "Comandos específicos:"
	@echo "  make backend-shell   - Shell de Django"
	@echo "  make backend-migrate - Correr migraciones"
	@echo "  make frontend-shell  - Shell del frontend"

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

ps:
	docker-compose ps

clean:
	docker-compose down -v
	docker system prune -f

setup: build
	docker-compose up -d db redis
	@echo "Esperando a que la DB esté lista..."
	@sleep 5
	docker-compose up -d backend
	docker-compose exec backend python manage.py makemigrations
	docker-compose exec backend python manage.py migrate
	docker-compose up -d frontend
	@echo "✅ Setup completo! Servicios corriendo:"
	@docker-compose ps

backend-shell:
	docker-compose exec backend python manage.py shell

backend-migrate:
	docker-compose exec backend python manage.py makemigrations
	docker-compose exec backend python manage.py migrate

frontend-shell:
	docker-compose exec frontend sh