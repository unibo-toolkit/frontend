COMPOSE := docker compose -f docker-compose.dev.yml

.PHONY: dev-setup dev dev-up dev-down dev-logs dev-reset dev-pull dev-prod

## One-time: generate dev JWT keys + scaffold env files
dev-setup:
	@bash dev/setup.sh

## Bring up the full local backend stack, then run the frontend (npm run dev)
dev: dev-up
	npm run dev

## Frontend on real prod data (read-only bridge, no local backend needed)
dev-prod:
	@node dev/prod-bridge.mjs & BRIDGE=$$!; trap "kill $$BRIDGE" EXIT INT TERM; \
	NEXT_PUBLIC_API_URL=http://localhost:8090 npm run dev

## Backend stack only (Postgres, Redis, migrate, auth, scraper, calendar, gateway)
dev-up:
	$(COMPOSE) up -d --wait

## Pull the latest :dev backend images
dev-pull:
	$(COMPOSE) pull

## Stop the stack (keeps data)
dev-down:
	$(COMPOSE) down

## Tail logs of the backend stack
dev-logs:
	$(COMPOSE) logs -f

## Nuke everything including the database + scraped data
dev-reset:
	$(COMPOSE) down -v
