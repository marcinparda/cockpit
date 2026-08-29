# litellm

Unified LLM gateway. External service, not part of the `cockpit-app` monorepo.

- **Port**: 4000 (prod container `litellm`), public at `litellm.parda.me`
- **Role**: single proxy all AI traffic routes through — Claude Code/Kiro use OAuth passthrough to Anthropic (`forward_client_headers_to_llm_api: true` + `x-litellm-api-key` header)
- **Observability**: logs to Langfuse Cloud
- **Secrets**: `LITELLM_MASTER_KEY`, `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_HOST`, `OPEN_ROUTER_KEY` (GitHub Secrets)

Full setup detail (architecture diagram, auth mechanism, Langfuse setup, local dev env vars, Cloudflare Tunnel config): [`docs/LITELLM_SETUP.md`](../../LITELLM_SETUP.md).
