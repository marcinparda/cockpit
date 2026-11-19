# Cockpit API

Cockpit API is the backend service for a personal productivity platform. Built with [FastAPI](https://fastapi.tiangolo.com/), it provides high performance, modern Python type safety, and automatic OpenAPI documentation.

### Services

- **Vikunja** — proxy to self-hosted Vikunja task manager; JWT auth per request (`/api/v1/vikunja/`)
- **Actual Budget** — proxy to self-hosted Actual Budget via `actual-http-api` wrapper; API key auth (`/api/v1/actual/`)
- **Redis Store** — generic key-value store (`/api/v1/store/{prefix}/{category}/{key}`) backed by Redis, used by the CV app to store CV sections and preset registries
- **Authentication** — JWT-based sessions with cookie transport
- **Authorization** — role and permission management

## Production Deployment (Raspberry Pi)

### Architecture

```
Raspberry Pi
├── cockpit_api_prod      — FastAPI app, port 8000
├── cockpit_db_prod       — PostgreSQL 15
├── cockpit_redis_prod    — Redis Stack
├── actual-http-api       — Actual Budget HTTP wrapper, port 5007
├── litellm               — LLM proxy (Anthropic/OpenRouter → Langfuse), port 4000
└── vikunja               — Task manager (external, vikunja_default network)
```

### MCP Server

Cockpit API exposes an MCP server at `/mcp` (Streamable HTTP transport).

- **URL**: `http://<raspberry-ip>:8000/mcp`
- **Auth**: `Authorization: Bearer <MCP_API_KEY>`
- **Tools**: budget (Actual Budget), tasks (Vikunja), cv (Redis presets), brain (Obsidian notes: query by frontmatter, patch/append, atomic batch, link graph — see `docs/backend/MCP_SERVER.md`)

Open WebUI connects to this MCP endpoint so AI models can call cockpit tools directly.

### Open WebUI

- **Port**: 4206
- **LLM backend**: LiteLLM proxy (`http://litellm:4000/v1`)
- **MCP**: connected to cockpit `/mcp` endpoint

### Deploying

```bash
# Run on Raspberry Pi — reads all vars from environment
./deploy-api.sh
```

Required env vars are listed at the top of `deploy-api.sh`. Key ones:

| Variable                                | Purpose                                              |
| --------------------------------------- | ---------------------------------------------------- |
| `MCP_API_KEY`                           | Bearer token for `/mcp` endpoint                     |
| `BRAIN_NOTES_PATH`                      | Host path mounted into container for notes           |
| `VIKUNJA_USERNAME` / `VIKUNJA_PASSWORD` | Service account for Vikunja                          |
| `ACTUAL_HTTP_API_KEY`                   | API key for actual-http-api sidecar                  |

## Getting Started

### Prerequisites

- Docker
- Docker Compose

### Installation & Running the API

Prepare your environment by copying the example environment file:

```bash
cp .env.example .env
```

Update the `.env` file with your database connection details and other configurations.

Start the development server using Docker Compose:

```bash
docker compose -f docker-compose.dev.yml up
```

### Database Migrations

Autogenerate alembic migrations:

```bash
docker compose -f docker-compose.dev.yml run --rm app alembic revision --autogenerate -m "<your_message>"
```

To use alembic migrations:

```bash
docker compose -f docker-compose.dev.yml run --rm cockpit_api alembic upgrade head
```

The API will be available at [http://localhost:8000](http://localhost:8000).

### API Documentation

- Swagger UI: [http://localhost:8000/api/docs](http://localhost:8000/api/docs)

## Contributing

Contributions are not welcome yet! This project is currently in its early stages, and I am focusing on building the core features. However, if you have suggestions or ideas, feel free to open an issue.

## License

This project is licensed under the MIT License.
