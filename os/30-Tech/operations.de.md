---
title: Betrieb — deployen, tunen, Fehler beheben
summary: Das Runbook - wie man deployt, wo die Dinge auf dem Server liegen und was zu tun ist, wenn etwas klemmt.
---

# Betrieb — deployen, tunen, Fehler beheben

## Wo die Dinge liegen

| Ort | Was |
|---|---|
| `/opt/hey-jesus` (Server) | Der Git-Checkout, aus dem der Stack läuft |
| `/opt/hey-jesus-data/knowledge` (Server) | Die **lebenden** Wissensdateien — absichtlich außerhalb des Repos: Deploys machen `git reset --hard`, und Änderungen aus dem Wissen-Tab müssen das überleben |
| `/opt/hey-jesus/.env` (Server) | Geheimnisse: Gemini-Schlüssel-Pool, Standardstimme, Dashboard-Auth-Hash. Nie in Git |
| GitHub `eidostein/jesus-os` | Quelle der Wahrheit; Push auf `main` deployt |

## Deployen

Normaler Weg: Merge/Push auf `main` → CI baut → Deploy-Workflow verbindet
sich per SSH und führt `deploy/deploy.sh` aus. Manueller Weg (gleiches
Ergebnis):

`ssh <server> '/opt/hey-jesus/deploy/deploy.sh'`

Das Skript pullt, baut die Container neu, sät *neue* Wissensdateien aus dem
Repo in den Live-Ordner (überschreibt nie bearbeitete) und baut `data.js`
dieses Dashboards neu, wenn Python verfügbar ist.

## Ändern, was Jesus weiß

Den **Wissen-Tab** nutzen — er bearbeitet den Live-Ordner direkt, gültig ab
dem nächsten Gespräch. `knowledge/` im Repo zu ändern, verändert nur die
*Saat* für Neuinstallationen; der Live-Ordner gewinnt.

## Fehler beheben

| Symptom | Wahrscheinliche Ursache → Abhilfe |
|---|---|
| „Die Leitung zum Himmel ist gerade belegt" beim Start | Alle API-Schlüssel scheitern (Quota oder tot). `docker logs hey-jesus-app-1` zeigt Fehler pro Schlüssel; frische Schlüssel in `GEMINI_API_KEYS` in `.env`, dann `docker compose up -d` |
| Sprachsession öffnet und stirbt sofort | Ein toter Schlüssel frisst den Versuch — der Proxy rotiert automatisch weiter; bleibt es, im Log nach `API key not valid` suchen und die Schlüssel ersetzen |
| Mikrofon wird nie abgefragt | Browser braucht HTTPS — prüfen, ob der Besucher hinter einem seltsamen Proxy auf `http://` hängt; Cloudflare muss auf orange Wolke stehen |
| Dashboard `/os` zeigt leere Panels | `data.js` lädt nicht — fast immer eine Hand-Änderung; mit `python3 os/scripts/build.py` neu bauen |
| Wissen-Tab meldet API nicht erreichbar | App-Container aus (`docker ps`) oder Caddy erreicht ihn nicht — `docker compose up -d` in `/opt/hey-jesus` |
| Seite komplett weg | `docker compose ps` in `/opt/hey-jesus`; Caddy und App müssen beide `Up` sein. Die Ports 80/443 darf sonst niemand belegen |

## Logs

`docker logs -f hey-jesus-app-1` — die App (Sessions, Schlüssel-Rotation,
Wissens-Ladevorgänge). `docker logs -f hey-jesus-caddy-1` — Zugriffe.
Session-Zeilen sehen so aus: `[live] session opened (voice=Charon, key #2)`.

## Das Dashboard-Passwort

`/os` liegt hinter Basic-Auth. Der bcrypt-Hash steht in `.env`
(`OS_DASH_HASH`); einen neuen erzeugt
`docker run --rm caddy caddy hash-password`, danach den Stack neu starten —
fertig ist die Passwort-Rotation.
