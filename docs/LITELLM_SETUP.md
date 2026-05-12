# LiteLLM + Langfuse Setup

LiteLLM proxy runs on the Raspberry Pi (port 4000), exposed via Cloudflare Tunnel at `https://litellm.parda.me`. All LLM traffic flows through it for unified observability in Langfuse Cloud.

## Architecture

```
Claude Code / Kiro (local) ──→ https://litellm.parda.me ──→ Anthropic API
  (OAuth token forwarded)         (logs to Langfuse)

Hermes (Pi container)       ──→ http://litellm:4000      ──→ OpenRouter
Open WebUI (Pi container)   ──→ http://litellm:4000      ──→ OpenRouter
                                       │
                                       └──→ Langfuse Cloud (traces)
```

## How Auth Works

Claude Code/Kiro use your **Pro subscription** (OAuth login). LiteLLM forwards your OAuth token to Anthropic via `forward_client_headers_to_llm_api: true`. LiteLLM authenticates you separately via `x-litellm-api-key` custom header. No Anthropic API key needed.

## Langfuse Cloud Setup

1. Sign up at https://cloud.langfuse.com (free tier: 50k observations/month, 30-day retention)
2. Create a project (e.g. "cockpit")
3. Go to Settings → API Keys → Create new key pair
4. Save `LANGFUSE_PUBLIC_KEY` (`pk-lf-...`) and `LANGFUSE_SECRET_KEY` (`sk-lf-...`)
5. Add these as GitHub Secrets (see below)

## Local Dev Setup (Claude Code + Kiro)

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
export ANTHROPIC_BASE_URL=https://litellm.parda.me
export ANTHROPIC_CUSTOM_HEADERS="x-litellm-api-key: Bearer sk-<your-litellm-master-key>"
```

Then restart your terminal. When you launch `claude` or `kiro`, you'll still log in with your Pro subscription as usual — the OAuth flow is unchanged. LiteLLM just sits in the middle, logging everything to Langfuse.

## Cloudflare Tunnel Config

Add to your tunnel config (`~/.cloudflared/config.yml` on the Pi):

```yaml
- hostname: litellm.parda.me
  service: http://localhost:4000
```

Then add a DNS CNAME record for `litellm.parda.me` pointing to your tunnel.

## Verifying It Works

After deploying, test the proxy health:

```bash
curl https://litellm.parda.me/health
```

Then use Claude Code normally — check Langfuse Cloud, traces should appear within seconds.

## GitHub Secrets Required

| Secret | Value |
|--------|-------|
| `LITELLM_MASTER_KEY` | Generate with `openssl rand -hex 24 \| sed 's/^/sk-/'` |
| `LANGFUSE_PUBLIC_KEY` | `pk-lf-...` from Langfuse Cloud project settings |
| `LANGFUSE_SECRET_KEY` | `sk-lf-...` from Langfuse Cloud project settings |
| `LANGFUSE_HOST` | `https://cloud.langfuse.com` |

Note: `OPEN_ROUTER_KEY` is already a secret — LiteLLM uses it for Hermes/Open WebUI traffic.
