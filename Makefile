# CVAT Local Development Makefile (macOS)
# Quick commands for common development tasks

.PHONY: help setup install-backend install-frontend start-docker start-frontend start-backend \
        stop restart migrate test test-frontend test-data test-cotreat clean reset \
        logs shell superuser docker-only hybrid qa lint lint-fix type-check

# Default target
.DEFAULT_GOAL := help

# Colors for output
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

# Python virtual environment
VENV := .venv
PYTHON := $(VENV)/bin/python
PIP := $(VENV)/bin/pip

# Docker compose files
COMPOSE := docker compose -f docker-compose.yml -f docker-compose.dev.yml

##@ Help

help: ## Display this help message
	@echo "$(CYAN)CVAT Development Makefile (macOS)$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "Usage:\n  make $(CYAN)<target>$(NC)\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(CYAN)%-20s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(YELLOW)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Initial Setup

setup: ## Complete initial setup (Docker + DB + Test Data)
	@echo "$(GREEN)Starting complete setup...$(NC)"
	@$(MAKE) start-docker
	@sleep 10
	@$(MAKE) migrate
	@$(MAKE) test-data
	@echo "$(GREEN)✓ Setup complete!$(NC)"
	@echo "$(CYAN)Run 'make docker-only' to use Docker-only mode$(NC)"
	@echo "$(CYAN)Or 'make hybrid' to use hybrid development mode$(NC)"

install-backend: ## Install Python dependencies
	@echo "$(GREEN)Installing Python dependencies...$(NC)"
	@if [ ! -d "$(VENV)" ]; then \
		echo "$(YELLOW)Creating virtual environment...$(NC)"; \
		python3 -m venv $(VENV); \
	fi
	@$(PIP) install -U pip wheel setuptools
	@$(PIP) install -r cvat/requirements/development.txt \
	                -r dev/requirements.txt
	@echo "$(GREEN)✓ Python dependencies installed$(NC)"

install-frontend: ## Install Node.js dependencies
	@echo "$(GREEN)Installing Node.js dependencies...$(NC)"
	@yarn --frozen-lockfile
	@echo "$(GREEN)✓ Node.js dependencies installed$(NC)"

##@ Docker Services

start-docker: ## Start Docker infrastructure services
	@echo "$(GREEN)Starting Docker services...$(NC)"
	@$(COMPOSE) up -d --build
	@echo "$(GREEN)✓ Docker services started$(NC)"
	@echo "$(CYAN)Run 'make logs' to view logs$(NC)"

stop: ## Stop all Docker services
	@echo "$(YELLOW)Stopping Docker services...$(NC)"
	@$(COMPOSE) down
	@echo "$(GREEN)✓ Services stopped$(NC)"

restart: ## Restart Docker services
	@$(MAKE) stop
	@$(MAKE) start-docker

logs: ## View Docker service logs (Ctrl+C to exit)
	@$(COMPOSE) logs -f

ps: ## Show status of Docker services
	@$(COMPOSE) ps

##@ Development Modes

docker-only: start-docker ## Start Docker-only mode (all services in containers)
	@echo ""
	@echo "$(GREEN)═══════════════════════════════════════════════════$(NC)"
	@echo "$(GREEN) Docker-only mode ready!$(NC)"
	@echo "$(GREEN)═══════════════════════════════════════════════════$(NC)"
	@echo ""
	@echo "$(CYAN)Access CVAT at:$(NC) http://localhost:8080"
	@echo "$(CYAN)Login:$(NC) admin / admin"
	@echo ""
	@echo "$(YELLOW)Available commands:$(NC)"
	@echo "  make logs          - View logs"
	@echo "  make stop          - Stop services"
	@echo "  make test-data     - Create test users/orgs"
	@echo ""

hybrid: start-docker ## Start hybrid development mode (local Django + frontend)
	@echo ""
	@echo "$(GREEN)═══════════════════════════════════════════════════$(NC)"
	@echo "$(GREEN) Hybrid development mode ready!$(NC)"
	@echo "$(GREEN)═══════════════════════════════════════════════════$(NC)"
	@echo ""
	@echo "$(CYAN)Next steps:$(NC)"
	@echo ""
	@echo "  Terminal 2: $(YELLOW)make start-frontend$(NC)"
	@echo "    → Frontend at http://localhost:3000"
	@echo ""
	@echo "  Terminal 3: $(YELLOW)make start-backend$(NC)"
	@echo "    → Backend at http://localhost:7000"
	@echo "    → Or use VS Code: press F5 for debugging"
	@echo ""
	@echo "$(CYAN)Access CVAT at:$(NC) http://localhost:3000"
	@echo "$(CYAN)Login:$(NC) admin / admin"
	@echo ""

start-frontend: install-frontend ## Start frontend dev server (http://localhost:3000)
	@echo "$(GREEN)Starting frontend dev server...$(NC)"
	@echo "$(CYAN)Access at: http://localhost:3000$(NC)"
	@yarn run start:cvat-ui

start-backend:
	@echo "$(GREEN)Starting Django backend...$(NC)"
	@echo "$(CYAN)Access at: http://localhost:8000$(NC)"
	@echo "$(YELLOW)Tip: Use VS Code F5 for debugging instead$(NC)"
	@. $(VENV)/bin/activate && ALLOWED_HOSTS="*" python manage.py runserver 0.0.0.0:8000

##@ Database Operations

migrate: ## Run Django database migrations
	@echo "$(GREEN)Running database migrations...$(NC)"
	@. $(VENV)/bin/activate && python manage.py migrate
	@. $(VENV)/bin/activate && python manage.py migrateredis
	@. $(VENV)/bin/activate && python manage.py collectstatic --noinput
	@. $(VENV)/bin/activate && python manage.py syncperiodicjobs
	@echo "$(GREEN)✓ Migrations complete$(NC)"

superuser: ## Create Django superuser (admin/admin)
	@echo "$(GREEN)Creating superuser...$(NC)"
	@$(COMPOSE) exec cvat_server python manage.py createsuperuser \
		--username admin --email admin@localhost --noinput || true
	@$(COMPOSE) exec cvat_server python manage.py shell -c \
		"from django.contrib.auth import get_user_model; \
		User = get_user_model(); \
		u = User.objects.get(username='admin'); \
		u.set_password('admin'); \
		u.save(); \
		print('✓ Superuser created: admin/admin')"

init-data: ## Create test organizations and users
	@echo "$(GREEN)Creating test data...$(NC)"
	@. $(VENV)/bin/activate && python dev/setup_test_data.py
	@echo "$(GREEN)✓ Test data created$(NC)"
	@echo "$(CYAN)Test users: owner1, maintainer1, supervisor1, worker1, worker2$(NC)"
	@echo "$(CYAN)Password: test123$(NC)"

shell: ## Open Django shell
	@. $(VENV)/bin/activate && python manage.py shell

db-shell: ## Open PostgreSQL shell
	@$(COMPOSE) exec cvat_db psql -U root -d cvat

##@ Testing

test-cotreat: ## Run CoTreat backend tests (fast, no Docker required)
	@echo "$(GREEN)Running CoTreat backend tests...$(NC)"
	@./cotreat_tests/run_django_tests.sh

test-frontend: ## Run frontend tests
	@echo "$(GREEN)Running frontend tests...$(NC)"
	@cd cvat-ui && yarn test

qa: ## Run all quality checks (lint + tests)
	@echo "$(CYAN)═══════════════════════════════════════════════════$(NC)"
	@echo "$(CYAN) Running Quality Assurance Checks$(NC)"
	@echo "$(CYAN)═══════════════════════════════════════════════════$(NC)"
	@echo ""
	@echo "$(YELLOW)[1/3] Running linters...$(NC)"
	@$(MAKE) lint
	@echo ""
	@echo "$(YELLOW)[2/3] Running backend tests...$(NC)"
	@$(MAKE) test-cotreat
	@echo ""
	@echo "$(YELLOW)[3/3] Running frontend tests...$(NC)"
	@$(MAKE) test-frontend
	@echo ""
	@echo "$(GREEN)═══════════════════════════════════════════════════$(NC)"
	@echo "$(GREEN) ✓ All quality checks passed!$(NC)"
	@echo "$(GREEN)═══════════════════════════════════════════════════$(NC)"

lint: ## Run linters
	@echo "$(GREEN)Running linters...$(NC)"
	@. $(VENV)/bin/activate && black --check cvat/
	@. $(VENV)/bin/activate && pylint cvat/
	@cd cvat-ui && yarn lint

lint-fix: ## Fix linting issues
	@echo "$(GREEN)Fixing linting issues...$(NC)"
	@. $(VENV)/bin/activate && black cvat/
	@. $(VENV)/bin/activate && isort cvat/
	@cd cvat-ui && yarn lint:fix

##@ Cleanup

clean: ## Clean temporary files and caches
	@echo "$(YELLOW)Cleaning temporary files...$(NC)"
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	@rm -rf .coverage htmlcov 2>/dev/null || true
	@rm -rf cvat-ui/dist cvat-core/dist cvat-canvas/dist 2>/dev/null || true
	@echo "$(GREEN)✓ Cleaned$(NC)"

reset: ## Reset everything (removes all data!)
	@echo "$(RED)⚠️  This will delete all data! Press Ctrl+C to cancel...$(NC)"
	@sleep 5
	@echo "$(YELLOW)Stopping services and removing volumes...$(NC)"
	@$(COMPOSE) down -v
	@echo "$(YELLOW)Removing virtual environment...$(NC)"
	@rm -rf $(VENV)
	@$(MAKE) clean
	@echo "$(GREEN)✓ Reset complete. Run 'make setup' to start fresh.$(NC)"

reset-db: ## Reset database only (keeps code/dependencies)
	@echo "$(YELLOW)Resetting database...$(NC)"
	@$(COMPOSE) down -v
	@$(MAKE) start-docker
	@sleep 10
	@$(MAKE) migrate
	@$(MAKE) superuser
	@$(MAKE) test-data
	@echo "$(GREEN)✓ Database reset complete$(NC)"

##@ Utilities

verify: ## Verify installation and show versions
	@echo "$(CYAN)System Information:$(NC)"
	@echo "  Python:  $$(python3 --version 2>&1)"
	@echo "  Node:    $$(node --version 2>&1)"
	@echo "  Yarn:    $$(yarn --version 2>&1)"
	@echo "  Docker:  $$(docker --version 2>&1)"
	@echo "  FFmpeg:  $$(ffmpeg -version 2>&1 | head -1)"
	@echo ""
	@if [ -d "$(VENV)" ]; then \
		echo "$(CYAN)Virtual Environment:$(NC)"; \
		. $(VENV)/bin/activate && pip show av numpy | grep -E "^(Name|Version):"; \
	else \
		echo "$(YELLOW)Virtual environment not created. See LOCAL_DEV_SETUP.md for setup instructions$(NC)"; \
	fi
	@echo ""
	@echo "$(CYAN)Docker Services:$(NC)"
	@$(COMPOSE) ps --format "table {{.Service}}\t{{.State}}" 2>/dev/null || echo "  $(YELLOW)Not running$(NC)"

urls: ## Show all service URLs
	@echo "$(CYAN)Service URLs:$(NC)"
	@echo ""
	@echo "$(GREEN)Docker-only mode:$(NC)"
	@echo "  CVAT UI:        http://localhost:8080"
	@echo "  API Docs:       http://localhost:8080/api/docs"
	@echo ""
	@echo "$(GREEN)Hybrid mode:$(NC)"
	@echo "  Frontend:       http://localhost:3000"
	@echo "  Backend API:    http://localhost:7000"
	@echo "  API Docs:       http://localhost:7000/api/docs"
	@echo ""
	@echo "$(GREEN)Infrastructure:$(NC)"
	@echo "  PostgreSQL:     localhost:5432"
	@echo "  Redis:          localhost:6379"
	@echo "  ClickHouse:     localhost:8123"
	@echo "  Grafana:        http://localhost:3000"

update: ## Update Docker services
	@echo "$(GREEN)Updating Docker services...$(NC)"
	@$(COMPOSE) pull
	@$(MAKE) rebuild
	@echo "$(GREEN)✓ Docker services updated$(NC)"

git-status: ## Show git status and modified files
	@echo "$(CYAN)Git Status:$(NC)"
	@git status --short

##@ Quick Development Workflows

dev: hybrid ## Alias for 'make hybrid' (start hybrid mode)

quick-start: start-docker superuser ## Quick start: Docker + create admin user
	@echo "$(GREEN)✓ Quick start complete!$(NC)"
	@echo "$(CYAN)Access CVAT at:$(NC) http://localhost:8080"
	@echo "$(CYAN)Login:$(NC) admin / admin"

rebuild: ## Rebuild and restart Docker services
	@echo "$(YELLOW)Rebuilding Docker services...$(NC)"
	@$(COMPOSE) down
	@$(COMPOSE) up -d --build
	@echo "$(GREEN)✓ Rebuild complete$(NC)"
