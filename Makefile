.PHONY: help build up down restart logs ps clean setup migrate makemigrations createsuperuser collectstatic shell-backend shell-db shell-redis shell-frontend test

help:
	@echo "Comandos disponibles:"
	@echo "  make setup      - Setup inicial (build + migrate + collectstatic)"
	@echo "  make build      - Construir todas las imágenes"
	@echo "  make up         - Levantar todos los servicios"
	@echo "  make down       - Bajar todos los servicios"
	@echo "  make restart    - Reiniciar todos los servicios"
	@echo "  make logs       - Ver logs de todos los servicios"
	@echo "  make ps         - Ver estado de los servicios"
	@echo "  make clean      - Limpiar containers y volúmenes"
	@echo ""
	@echo "Django:"
	@echo "  make migrate        - Correr migraciones"
	@echo "  make makemigrations - Crear nuevas migraciones"
	@echo "  make createsuperuser - Crear usuario admin"
	@echo "  make collectstatic  - Recolectar archivos estáticos"
	@echo "  make test           - Correr tests"
	@echo ""
	@echo "Shell/Debug:"
	@echo "  make shell-backend  - Shell de Django"
	@echo "  make shell-db      - Shell de PostgreSQL"
	@echo "  make shell-redis   - Shell de Redis"
	@echo "  make shell-frontend - Shell del frontend"

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

migrate:
	docker-compose exec backend python manage.py migrate

makemigrations:
	docker-compose exec backend python manage.py makemigrations

createsuperuser:
	docker-compose exec backend python manage.py createsuperuser

collectstatic:
	docker-compose exec backend python manage.py collectstatic --noinput

test:
	docker-compose exec backend python manage.py test

shell-backend:
	docker-compose exec backend python manage.py shell

shell-db:
	docker-compose exec db psql -U hornero_user -d hornero_db

shell-redis:
	docker-compose exec redis redis-cli

shell-frontend:
	docker-compose exec frontend sh

setup: build
	@echo "🚀 Iniciando setup del proyecto..."
	docker-compose up -d db redis
	@echo "⏳ Esperando a que la DB esté lista..."
	@sleep 5
	docker-compose up -d backend
	@echo "📝 Creando migraciones..."
	docker-compose exec backend python manage.py makemigrations
	@echo "🗄️ Aplicando migraciones..."
	docker-compose exec backend python manage.py migrate
	@echo "📦 Recolectando archivos estáticos..."
	docker-compose exec backend python manage.py collectstatic --noinput
	@echo "🎨 Levantando frontend..."
	docker-compose up -d frontend
	@echo ""
	@echo "✅ Setup completo! Servicios corriendo:"
	@docker-compose ps
	@echo ""
	@echo "📌 URLs disponibles:"
	@echo "   Frontend: http://localhost:5173"
	@echo "   Backend API: http://localhost:8000/api"
	@echo "   Django Admin: http://localhost:8000/admin"
	@echo ""
	@echo "💡 Próximo paso: make createsuperuser"