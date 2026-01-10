install-backend:
	chmod +x backend/install.sh
	chmod +x backend/run.sh
	cd backend && ./install.sh

install-frontend:
	chmod +x frontend/install.sh
	chmod +x frontend/run.sh
	cd frontend && ./install.sh

install: install-backend install-frontend

run-backend:
	cd backend && ./run.sh

run-frontend:
	cd frontend && ./run.sh

build-frontend:
	cd frontend && npm run build

build-backend:
	cd backend && echo "Backend build - ensuring dependencies are installed..." && python3 -m pip install -r requirements.txt

build: build-frontend build-backend

check-env:
	@echo "🔍 Checking environment variables..."
	@echo "Checking frontend environment..."
	@if [ -f frontend/.env ]; then \
		grep -q "VITE_SUPABASE_URL=" frontend/.env && grep -q "VITE_SUPABASE_ANON_KEY=" frontend/.env && \
		! grep -q "your_" frontend/.env && echo "✅ Frontend environment OK" || \
		echo "❌ Frontend environment missing or has placeholder values"; \
	else \
		echo "❌ Frontend .env file not found"; \
	fi
	@echo "Checking backend environment..."
	@if [ -f backend/.env ]; then \
		grep -q "SUPABASE_URL=" backend/.env && grep -q "SUPABASE_ANON_KEY=" backend/.env && \
		! grep -q "your_" backend/.env && echo "✅ Backend environment OK" || \
		echo "❌ Backend environment missing or has placeholder values"; \
	else \
		echo "❌ Backend .env file not found"; \
	fi
	@echo "✅ Environment check completed!"

lint-frontend:
	cd frontend && npm run lint

type-check:
	cd frontend && npm run type-check

lint: lint-frontend

check: lint type-check test

seed-demo:
	@echo "🌱 Seeding demo data for NGX Pulse..."
	@if [ ! -f backend/.env ]; then \
		echo "❌ Backend .env file not found. Please set up environment variables first."; \
		exit 1; \
	fi
	cd scripts && python seed-demo-data.py --days 30

seed-demo-clean:
	@echo "🧹 Cleaning and re-seeding demo data..."
	cd scripts && python seed-demo-data.py --days 30 --clean

.PHONY: test build check-env lint-frontend type-check lint check seed-demo seed-demo-clean
test:
	pytest

.DEFAULT_GOAL := install
