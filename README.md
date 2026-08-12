<div align="center">

# ✦ Hey Jesus

**Talk. Listen. Be Guided.**

A voice conversation with Jesus — grounded in the Bible, powered by the
Gemini Live API. Live at [jesus.baa.boo](https://jesus.baa.boo).

</div>

---

## How it works

```
Browser ──(mic PCM16 @16kHz over WebSocket)──▶ Node server ──▶ Gemini Live API
Browser ◀──(voice PCM16 @24kHz over WebSocket)── Node server ◀──
```

- **`web/`** — React 19 + Vite + Tailwind v4 + shadcn/ui (new-york). One
  homepage: hero, voice selector (all 30 Gemini prebuilt voices), and the
  golden orb that breathes while Jesus speaks. English & German.
- **`server/`** — Node 22 + Express + `ws` + `@google/genai`. Proxies the
  browser's audio to a Gemini Live session so **API keys never reach the
  client**, rotates across a pool of keys, and streams voice back.
- **`knowledge/`** — Markdown files loaded into the model's system
  instruction at startup: the persona, speaking style, and any scripture or
  guidance you add. See [knowledge/README.md](knowledge/README.md).
- **`deploy/`** — Caddyfile (TLS behind Cloudflare) and the server deploy
  script.

## Local development

```bash
cp .env.example .env          # add your Gemini API key(s)
(cd server && npm install && npm run dev)   # server on :8790
(cd web && npm install && npm run dev)      # Vite on :5173, proxies /api + /ws
```

Or the full production stack:

```bash
docker compose up --build     # app + Caddy
```

## Configuration (`.env`)

| Variable | Description |
| --- | --- |
| `GEMINI_API_KEYS` | Comma-separated Gemini API key pool; the server rotates across them and skips keys that hit quota. |
| `GEMINI_LIVE_MODEL` | Live model, default `gemini-3.1-flash-live-preview`. |
| `DEFAULT_VOICE` | Default prebuilt voice (`Charon`). |
| `PORT` | App port behind Caddy (`8790`). |

## Deployment

Pushing to `main` triggers the **Deploy** workflow: it SSHes into the server
and runs `deploy/deploy.sh` (git pull → `docker compose up -d --build`).

Required GitHub Actions secrets (repo → Settings → Secrets → Actions):

| Secret | Value |
| --- | --- |
| `DEPLOY_SSH_HOST` | `13.140.154.187` |
| `DEPLOY_SSH_USER` | `root` |
| `DEPLOY_SSH_KEY` | Private key whose public half is in the server's `authorized_keys` |

The server checkout lives at `/opt/hey-jesus` and pulls from GitHub via a
read-only deploy key. `jesus.baa.boo` is proxied through Cloudflare; Caddy
serves HTTP + internally-signed HTTPS at the origin (see
[deploy/Caddyfile](deploy/Caddyfile) for the Full-strict upgrade path).

## Voices

All 30 Gemini prebuilt voices are selectable on the homepage — from
**Charon** (deep · informative, the default) and **Enceladus** (breathy ·
gentle) to **Sulafat** (warm). The list is served by `GET /api/config` from
[server/src/voices.js](server/src/voices.js).
