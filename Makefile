COMPOSE := docker compose

# Recipes must work in both a POSIX shell and Windows cmd.exe (native make
# on Windows runs recipes through cmd), so avoid shell-specific syntax.
ifeq ($(OS),Windows_NT)
  COPY := copy /Y
else
  COPY := cp
endif

# Read settings such as APP_PORT from .env (created on first run).
-include .env
APP_URL := http://localhost:$(or $(APP_PORT),3000)

.PHONY: up down clean fclean re migrate url logs ps

## up: build the app image and start the app + database in the background
up: .env
	$(COMPOSE) up -d --build
	@echo App running at $(APP_URL)

## down: stop the containers (they are kept, so `make up` resumes them)
down:
	$(COMPOSE) stop

## clean: stop and delete the containers, network and app image - keeps the database volume
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
	@echo App running at $(APP_URL)

logs:
	$(COMPOSE) logs -f

ps:
	$(COMPOSE) ps

.env:
	$(COPY) .env.example .env
	@echo Created .env from .env.example - set POSTGRES_PASSWORD before real use.
