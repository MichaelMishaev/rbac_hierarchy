# ============================================
# RBAC Hierarchy Platform - Development Commands
# ============================================

.PHONY: help setup up down logs clean db-migrate db-seed db-reset test

# Default target
.DEFAULT_GOAL := help

help: ## Show this help message
	@echo "RBAC Hierarchy Platform - Development Commands"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

setup: ## Initial setup - copy .env and install dependencies
	@echo "Setting up development environment..."
	@if [ ! -f .env ]; then cp .env.example .env && echo "✅ Created .env file"; else echo "⚠️  .env already exists"; fi
	@echo "✅ Setup complete! Edit .env if needed, then run: make up"

up: ## Start all Docker containers
	@echo "Starting Docker containers..."
	@docker-compose up -d
	@echo ""
	@echo "✅ Containers started!"
	@echo ""
	@echo "Services available:"
	@echo "  - PostgreSQL:    localhost:5434"
	@echo "  - PgBouncer:     localhost:6433 (use this for app)"
	@echo "  - Redis:         localhost:6381"
	@echo "  - Adminer:       http://localhost:8081"
	@echo "  - MailHog:       http://localhost:8025"
	@echo ""
	@echo "Run 'make logs' to see container logs"

down: ## Stop all Docker containers
	@echo "Stopping Docker containers..."
	@docker-compose down
	@echo "✅ Containers stopped"

restart: ## Restart all containers
	@echo "Restarting containers..."
	@docker-compose restart
	@echo "✅ Containers restarted"

logs: ## Show logs from all containers
	@docker-compose logs -f

logs-postgres: ## Show PostgreSQL logs
	@docker-compose logs -f postgres

logs-redis: ## Show Redis logs
	@docker-compose logs -f redis

ps: ## Show running containers
	@docker-compose ps

clean: ## Stop containers and remove volumes (⚠️  deletes all data!)
	@echo "⚠️  This will delete all data. Are you sure? [y/N] " && read ans && [ $${ans:-N} = y ]
	@docker-compose down -v
	@echo "✅ Containers and volumes removed"

db-shell: ## Connect to PostgreSQL with psql
	@docker-compose exec postgres psql -U postgres -d hierarchy_platform

db-migrate: ## Run database migrations (when Prisma is set up)
	@echo "Running database migrations..."
	@# npx prisma migrate dev
	@echo "⚠️  Prisma not set up yet. Run migrations manually when backend is ready."

db-seed: ## Seed database with sample data
	@echo "Seeding database..."
	@# npx prisma db seed
	@echo "⚠️  Seed script not implemented yet"

db-reset: ## Reset database (⚠️  deletes all data!)
	@echo "⚠️  This will delete all data. Are you sure? [y/N] " && read ans && [ $${ans:-N} = y ]
	@docker-compose down postgres
	@docker volume rm corporations_postgres_data || true
	@docker-compose up -d postgres
	@echo "✅ Database reset. Extensions will be reinstalled automatically."

db-backup: ## Backup database to ./backups/
	@echo "Backing up database..."
	@mkdir -p backups
	@docker-compose exec -T postgres pg_dump -U postgres -Fc hierarchy_platform > backups/backup-$$(date +%Y%m%d-%H%M%S).dump
	@echo "✅ Backup created in ./backups/"

db-restore: ## Restore database from backup (usage: make db-restore FILE=backups/backup-xxx.dump)
	@if [ -z "$(FILE)" ]; then echo "Error: specify FILE=backups/xxx.dump"; exit 1; fi
	@echo "Restoring from $(FILE)..."
	@docker-compose exec -T postgres pg_restore -U postgres -d hierarchy_platform -c < $(FILE)
	@echo "✅ Database restored"

redis-cli: ## Connect to Redis CLI
	@docker-compose exec redis redis-cli -a redis_dev_password

redis-flush: ## Flush all Redis data
	@echo "⚠️  This will delete all Redis data. Are you sure? [y/N] " && read ans && [ $${ans:-N} = y ]
	@docker-compose exec redis redis-cli -a redis_dev_password FLUSHALL
	@echo "✅ Redis flushed"

test: ## Run Playwright tests
	@echo "Running Playwright tests..."
	@npm test

test-ui: ## Run Playwright tests with UI
	@npx playwright test --ui

test-headed: ## Run Playwright tests in headed mode
	@npx playwright test --headed

install: ## Install npm dependencies
	@echo "Installing dependencies..."
	@npm install
	@echo "✅ Dependencies installed"

dev-backend: ## Start backend in development mode (when ready)
	@echo "⚠️  Backend not implemented yet"
	@# cd backend && npm run dev

dev-frontend: ## Start frontend in development mode (when ready)
	@echo "⚠️  Frontend not implemented yet"
	@# cd frontend && npm run dev

health: ## Check health of all services
	@echo "Checking service health..."
	@echo ""
	@echo "PostgreSQL:"
	@docker-compose exec postgres pg_isready -U postgres || echo "❌ PostgreSQL not ready"
	@echo ""
	@echo "Redis:"
	@docker-compose exec redis redis-cli -a redis_dev_password ping || echo "❌ Redis not ready"
	@echo ""
	@echo "Docker containers:"
	@docker-compose ps

status: health ## Alias for health

# Development workflow shortcuts
dev: up ## Start development environment
	@echo ""
	@echo "🚀 Development environment is ready!"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Check services: make health"
	@echo "  2. View logs: make logs"
	@echo "  3. Access Adminer: open http://localhost:8081"
	@echo "  4. Access MailHog: open http://localhost:8025"

stop: down ## Stop development environment
