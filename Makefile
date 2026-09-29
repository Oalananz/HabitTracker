COMPOSE := docker compose

.PHONY: up down clean fclean re migrate url logs ps

## up: build the app image and start the app + database in the background
up: .env
	$(COMPOSE) up -d --build
	@$(MAKE) --no-print-directory url

## down: stop the containers (they are kept, so `make up` resumes them)
down:
	$(COMPOSE) stop

## clean: stop and delete the containers, network and app image — keeps the database volume
clean:
	$(COMPOSE) down --remove-orphans --rmi local

## fclean: clean + delete the database volume (ALL DATA IS LOST)
fclean:
	$(COMPOSE) down --remove-orphans --rmi local --volumes

## re: rebuild everything from scratch (fclean + up)
re: fclean up

## migrate: apply any new db/migrations/*.sql to the database
migrate: .env
	$(COMPOSE) run --rm migrate

## url: print the address the app is served on (APP_PORT in .env, default 3000)
url:
	@port=$$(sed -n 's/^APP_PORT=//p' .env 2>/dev/null | tr -d '\r"'); \
	echo "App running at http://localhost:$${port:-3000}"

logs:
	$(COMPOSE) logs -f

ps:
	$(COMPOSE) ps

.env:
	cp .env.example .env
	@echo "Created .env from .env.example — edit POSTGRES_PASSWORD before real use."
