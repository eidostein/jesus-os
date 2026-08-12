---
title: Architektur — die Maschinerie unter jesus.baa.boo
summary: Repo-Aufbau, die Sprachpipeline, Docker/Caddy/Cloudflare, CI/CD — und warum die API-Schlüssel nie in den Browser gelangen können.
---

# Architektur — die Maschinerie unter jesus.baa.boo

Ein Repo (`eidostein/jesus-os`), ein Server, drei bewegliche Teile: ein
statisches Frontend, ein kleines Node-Backend und Caddy davor. Alles läuft
als ein Docker-Compose-Stack.

## Repo-Aufbau

| Pfad | Was |
|---|---|
| `web/` | React 19 + Vite + Tailwind v4 + shadcn/ui — die Homepage |
| `server/` | Node 22 + Express + `ws` + `@google/genai` — Sprach-Proxy & Wissens-API |
| `knowledge/` | Die Markdown-Dateien, die zur Systeminstruktion werden (Saat-Kopie; die Live-Kopie liegt außerhalb des Repos, siehe *Betrieb*) |
| `os/` | Dieses Dashboard: Engine von segnals-os geerbt, zweisprachige Doku, `data/*.json` |
| `deploy/` | Caddyfile + `deploy.sh` (das serverseitige Deploy-Skript) |
| `.github/workflows/` | CI (Build + Typecheck + Docker-Build) und Deploy (SSH → `deploy.sh`) |

## Die Sprachpipeline

`Browser-Mikrofon → AudioWorklet (PCM16 @16kHz) → WebSocket /ws →
Node-Server → Gemini Live API` — und derselbe Weg zurück mit 24kHz für seine
Stimme.

Die wichtigen Eigenschaften:

- **Schlüssel bleiben serverseitig.** Der Browser sieht nie einen
  Gemini-API-Schlüssel; er spricht nur mit unserem eigenen WebSocket. Der
  Server hält einen **Schlüssel-Pool** (`GEMINI_API_KEYS`, kommagetrennt) und
  rotiert: tote oder limitierte Schlüssel werden automatisch übersprungen.
  Eine Live-API-Eigenheit fangen wir ab: Ein ungültiger Schlüssel wird *nach*
  dem Socket-Aufbau abgelehnt (asynchroner Close 1007), daher beobachtet der
  Proxy pro Schlüssel ein 1,5-Sekunden-Zeitfenster, bevor er der Session
  vertraut.
- **Sprache wird instruiert, nicht festgenagelt.** Wir setzen bewusst keinen
  `languageCode` in der Sprachkonfiguration — das würde seine Zunge
  einsperren. Die Oberflächensprache (standardmäßig Deutsch) wandert als
  Startpräferenz in die Systeminstruktion; die Persona-Regel „spiegle die
  Sprache des Sprechers" erledigt den Rest.
- **Unterbrechen ist nativ.** Geminis Sprachaktivitätserkennung meldet
  `interrupted`; der Server reicht es durch und der Browser verwirft sofort
  alles geplante Audio.
- **Wissen wird pro Gespräch frisch gelesen** — Änderungen aus dem Wissen-Tab
  gelten ohne Neustart.

## Auslieferung & TLS

Caddy bedient den Origin hinter **Cloudflare** (orange Wolke): einfaches HTTP
und intern signiertes HTTPS zugleich — das deckt Cloudflares Flexible- und
Full-SSL-Modus ab. `/` und `/ws` gehen per Proxy zur App; `/os` liefert dieses
Dashboard hinter Basic-Auth aus (Hash kommt per Env, nie committet — geerbte
Praxis aus segnals-os); `/os/api/*` erreicht die Wissens-API, gleiche
Authentifizierung.

## CI/CD

Jeder Push auf `main` läuft durch CI (Web-Build + Typecheck, Server-Check,
kompletter Docker-Build). Der Deploy-Workflow verbindet sich dann per SSH mit
dem Server und führt `deploy/deploy.sh` aus: `git reset --hard origin/main` →
`docker compose up -d --build` → aufräumen. Rollback = Commit revertieren und
pushen; die Pipeline deployt den alten Stand.

## Dashboard & Daten

Dieses Dashboard ist die segnals-os-Engine, neu eingekleidet: Markdown ist die
Quelle der Wahrheit für Prosa, `os/data/*.json` für alles Bewertete,
`python3 os/scripts/build.py` backt beides in `data.js`, und `dashboard.html`
stellt es dar — statisch, in sich geschlossen, zweisprachig. Der Wissen-Tab
ist der eine lebendige (API-gestützte) Teil.
