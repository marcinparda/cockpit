API_DIR = cockpit-api
APP_DIR = cockpit-app

# ── Root: run everything ──────────────────────────────────────────────────────
run:
	$(MAKE) api-up-d
	cd $(APP_DIR) && npm run start:all

# ── API (cockpit-api) ─────────────────────────────────────────────────────────
api-up:
	$(MAKE) -C $(API_DIR) up

api-up-d:
	$(MAKE) -C $(API_DIR) up-d

api-down:
	$(MAKE) -C $(API_DIR) down

api-restart:
	$(MAKE) -C $(API_DIR) restart

api-logs:
	$(MAKE) -C $(API_DIR) logs

api-install:
	$(MAKE) -C $(API_DIR) install

api-migrate:
	$(MAKE) -C $(API_DIR) migrate

api-downgrade:
	$(MAKE) -C $(API_DIR) downgrade

# Usage: make api-migration m="add_users_table"
api-migration:
	$(MAKE) -C $(API_DIR) migration m="$(m)"

api-test:
	$(MAKE) -C $(API_DIR) test

api-test-cov:
	$(MAKE) -C $(API_DIR) test-cov

api-shell:
	$(MAKE) -C $(API_DIR) shell

# ── App (cockpit-app) ─────────────────────────────────────────────────────────
app-install:
	cd $(APP_DIR) && npm install

app-run:
	cd $(APP_DIR) && npm run start:all

app-run-cockpit:
	cd $(APP_DIR) && npx nx serve cockpit

app-run-login:
	cd $(APP_DIR) && npx nx serve login

app-run-cv:
	cd $(APP_DIR) && npx nx serve cv

app-run-store:
	cd $(APP_DIR) && npx nx serve store

app-build:
	cd $(APP_DIR) && npm run build:all

app-test:
	cd $(APP_DIR) && npm run test

app-update-types:
	cd $(APP_DIR) && npm run update:types

app-validate-types:
	cd $(APP_DIR) && npm run validate:types

# ── Combined ──────────────────────────────────────────────────────────────────
install:
	$(MAKE) api-install
	$(MAKE) app-install

test:
	$(MAKE) api-test
	$(MAKE) app-test

.PHONY: run \
	api-up api-up-d api-down api-restart api-logs \
	api-install api-migrate api-downgrade api-migration \
	api-test api-test-cov api-shell \
	app-install app-run \
	app-run-cockpit app-run-login app-run-cv app-run-store \
	app-build app-test app-update-types app-validate-types \
	install test
