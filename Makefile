.PHONY: up down build logs test monitoring clean

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose up -d --build

logs:
	docker compose logs -f

test:
	cd backend && npm test
	cd frontend && npm test

monitoring:
	@echo "Grafana:    http://localhost:3002 (admin/admin)"
	@echo "Prometheus: http://localhost:9090"
	@echo "Metrics:    http://localhost:3001/metrics"

clean:
	docker compose down -v
	rm -rf backend/dist backend/coverage frontend/.next
