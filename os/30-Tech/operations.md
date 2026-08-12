---
title: Operations — deploying, tuning, troubleshooting
summary: The runbook - how to deploy, where things live on the server, and what to do when something misbehaves.
category: Tech
audience: operators
order: 10
updated: 2026-08-12
---

# Operations — deploying, tuning, troubleshooting

## Where things live

| Place | What |
|---|---|
| `/opt/hey-jesus` (server) | The git checkout the stack runs from |
| `/opt/hey-jesus-data/knowledge` (server) | The **live** knowledge files — outside the repo on purpose: deploys run `git reset --hard`, and edits made in the Knowledge tab must survive that |
| `/opt/hey-jesus/.env` (server) | Secrets: Gemini key pool, default voice, dashboard auth hash. Never in git |
| GitHub `eidostein/jesus-os` | Source of truth; push to `main` deploys |

## Deploying

Normal path: merge/push to `main` → CI builds → Deploy workflow SSHes in and
runs `deploy/deploy.sh`. Manual path (same result):

`ssh <server> '/opt/hey-jesus/deploy/deploy.sh'`

The script pulls, rebuilds containers, seeds any *new* knowledge files from
the repo into the live folder (never overwriting edited ones), and rebuilds
this dashboard's `data.js` when Python is available.

## Changing what Jesus knows

Use the **Knowledge tab** — it edits the live folder directly and applies from
the next conversation. Editing `knowledge/` in the repo only changes the
*seed* for fresh installs; the live folder wins.

## Troubleshooting

| Symptom | Likely cause → fix |
|---|---|
| "The line to heaven is busy" on start | All API keys failing (quota or dead). `docker logs hey-jesus-app-1` shows per-key errors; add fresh keys to `GEMINI_API_KEYS` in `.env`, `docker compose up -d` |
| Voice session opens then dies instantly | One dead key eats the attempt — the proxy rotates past it automatically; if it persists, check which keys log `API key not valid` and replace them |
| Mic never asked for | Browser needs HTTPS — check the visitor isn't on plain `http://` behind an odd proxy; Cloudflare must be orange-cloud |
| Dashboard `/os` shows empty panels | `data.js` failed to load — almost always a hand-edit; rebuild with `python3 os/scripts/build.py` |
| Knowledge tab says API unreachable | App container down (`docker ps`), or Caddy can't reach it — `docker compose up -d` in `/opt/hey-jesus` |
| Site down entirely | `docker compose ps` in `/opt/hey-jesus`; Caddy and app should both be `Up`. Ports 80/443 must not be claimed by anything else |

## Logs

`docker logs -f hey-jesus-app-1` — the app (sessions, key rotation, knowledge
loads). `docker logs -f hey-jesus-caddy-1` — access logs. Session lines look
like: `[live] session opened (voice=Charon, key #2)`.

## The dashboard password

`/os` sits behind basic auth. The bcrypt hash lives in `.env`
(`OS_DASH_HASH`); generate a new one with
`docker run --rm caddy caddy hash-password` and restart the stack to rotate
the password.
