---
title: Architecture — the machinery under jesus.baa.boo
summary: Repo layout, the voice pipeline, Docker/Caddy/Cloudflare, CI/CD, and why the API keys can never leak to the browser.
category: Tech
audience: engineers
order: 1
updated: 2026-08-12
---

# Architecture — the machinery under jesus.baa.boo

One repo (`eidostein/jesus-os`), one server, three moving parts: a static
frontend, a small Node backend, and Caddy in front. Everything ships as one
Docker Compose stack.

## Repo layout

| Path | What |
|---|---|
| `web/` | React 19 + Vite + Tailwind v4 + shadcn/ui — the homepage |
| `server/` | Node 22 + Express + `ws` + `@google/genai` — voice proxy & knowledge API |
| `knowledge/` | The markdown files that become the system instruction (seed copy; live copy sits outside the repo, see *Operations*) |
| `os/` | This dashboard: engine inherited from segnals-os, bilingual docs, `data/*.json` |
| `deploy/` | Caddyfile + `deploy.sh` (the server-side deploy script) |
| `.github/workflows/` | CI (build + typecheck + docker build) and Deploy (SSH → `deploy.sh`) |

## The voice pipeline

`Browser mic → AudioWorklet (PCM16 @16kHz) → WebSocket /ws → Node server →
Gemini Live API` — and the same road back at 24kHz for his voice.

The important properties:

- **Keys stay server-side.** The browser never sees a Gemini API key; it only
  talks to our own WebSocket. The server holds a comma-separated **pool of
  keys** (`GEMINI_API_KEYS`) and rotates: dead or quota-limited keys are
  skipped automatically. A Live-API quirk we handle: an invalid key is
  rejected *after* the socket opens (async close 1007), so the proxy watches a
  1.5s grace window per key before trusting the session.
- **Language is instructed, not pinned.** We deliberately do not set
  `languageCode` in the speech config — pinning it would lock his tongue. The
  UI language (German by default) is passed into the system instruction as a
  starting preference; the persona rule "mirror the speaker's language" does
  the rest.
- **Interruption is native.** Gemini's voice-activity detection signals
  `interrupted`; the server relays it and the browser drops all scheduled
  audio instantly.
- **Knowledge is read fresh per conversation**, so Knowledge-tab edits apply
  without restart.

## Serving & TLS

Caddy terminates the origin behind **Cloudflare** (orange cloud): it serves
both plain HTTP and internally-signed HTTPS, which covers Cloudflare's
Flexible and Full SSL modes. `/` and `/ws` proxy to the app; `/os` serves this
dashboard behind basic auth (hash injected via env, never committed —
inherited practice from segnals-os); `/os/api/*` reaches the knowledge API,
same auth.

## CI/CD

Every push to `main` runs CI (web build + typecheck, server syntax check,
full Docker build). The Deploy workflow then SSHes into the server and runs
`deploy/deploy.sh`: `git reset --hard origin/main` → `docker compose up -d
--build` → prune. Rollback = revert the commit and push; the pipeline redeploys
the old state.

## Dashboards & data

This dashboard is the segnals-os engine, re-themed: markdown is the source of
truth for prose, `os/data/*.json` for anything scored, `python3
os/scripts/build.py` bakes both into `data.js`, and `dashboard.html` renders
it — static, self-contained, bilingual. The Knowledge tab is the one live
(API-backed) part.
