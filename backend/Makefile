.PHONY: help build up down restart logs shell migrate makemigrations test clean

help:
	@echo "Comandos disponibles:"
	@echo "  make build       - Construir imagenes Docker"
	@echo "  make up          - Levantar servicios"
	@echo "  make down        - Bajar servicios"
	@echo "  make restart     - Reiniciar servicios"
	@echo "  make logs        - Ver logs"
	@echo "  make shell       - Shell Django"
	@echo "  make migrate     - Correr migraciones"
	@echo "  make test        - Correr tests"
	@echo "  make clean       - Limpiar containers y volumenes"

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

shell:
	docker-compose exec backend python manage.py shell

migrate:
	docker-compose exec backend python manage.py migrate

makemigrations:
	docker-compose exec backend python manage.py makemigrations

test:
	docker-compose exec backend python manage.py test

clean:
	docker-compose down -v
	docker system prune -f