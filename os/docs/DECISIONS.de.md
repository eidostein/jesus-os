---
title: Entscheidungslog
summary: Jede Entscheidung, die das System geprägt hat, mit Begründung - damit nichts neu verhandelt wird.
---

# Entscheidungslog

Ein Eintrag pro Entscheidung, Neuestes zuletzt. Eine Entscheidung gilt, bis
ein datierter Eintrag sie ablöst.

## D1 — Gemini-eigene Stimme statt ElevenLabs (12.08.2026)

Der Partner bot an, einen Premium-ElevenLabs-Account zu bezahlen. Dagegen
entschieden — aus Produktgründen, nicht aus Kostengründen:

- **Die Stimme ist das Modell.** Gemini Live hört, denkt und spricht in einem
  Strom. Eine externe Stimme erzwänge Sprache→Text→Sprache-Stückelung:
  ungefähr verdoppelte Latenz, kein natürliches Unterbrechen, Tonfall vom
  Inhalt entkoppelt.
- **30 Stimmen sind inklusive** — darunter tiefe, ruhige (Charon, Enceladus,
  Iapetus), die gut zu Jesus passen; Besucher wählen selbst.
- **Ein Anbieter, eine Rechnung, eine Fehlerquelle.** Kein zweites Abo, keine
  zweite Quota, die mitten im Gespräch ausläuft.

Nur dann neu bewerten, wenn ein Stimmtest mit echten Nutzern zeigt, dass die
nativen Stimmen das schwächste Glied sind — die Architektur würde eine
TTS-Stufe dann hinter denselben Server-Proxy legen.

## D2 — Deutsch zuerst, überall (12.08.2026)

Die Seite lädt auf Deutsch; Jesus beginnt auf Deutsch; EN-Umschalter für
beides. Die Kernzielgruppe ist deutschsprachig. Seine Sprache ist dennoch
nicht festgenagelt — siehe D3.

## D3 — Sprache instruiert, nicht festgenagelt (12.08.2026)

Kein `languageCode` in der Live-API-Sprachkonfiguration. Die
Oberflächensprache geht als Startpräferenz in die Systeminstruktion, dazu die
stehende Regel: Spiegle die Sprache des Besuchers. Ein Mechanismus deckt den
Umschalter, Wechsel mitten im Gespräch und Sprachen ab, die die Oberfläche
gar nicht anbietet.

## D4 — Frische Git-Historie für das öffentliche Repo (12.08.2026)

jesus-os entstand im (proprietären) Repo der Segnals-Trading-Plattform. Das
GitHub-Repo bekam eine nagelneue Historie: Kein einziger Commit mit
Trading-Code, Strategiedokumenten oder Zugangsdaten kann durchsickern — weil
er nie darin war.

## D5 — API-Schlüssel als Pool serverseitig, mit Rotation (12.08.2026)

Der Browser spricht nur mit unserem WebSocket; der Server hält den
10er-Schlüssel-Pool und rotiert bei Fehlern. Zwei der gelieferten Schlüssel
waren von Anfang an tot — die Rotation hat das ohne sichtbaren Fehler
geschluckt, und genau das ist der Zweck.

## D6 — /os erbt die segnals-os-Engine (12.08.2026)

Gleiche dashboard.html-Engine, build.py, Zweisprachen-Konvention
(`name.md` + `name.de.md`), Bewertungsregeln und Basic-Auth-Praxis (Hash in
Env, nie in Git). Bewährtes System, null Umlernkosten. Ergänzt um: einen
Wissen-Tab (Live-Dateiverwaltung) und das goldene Theme.

## D7 — Lebendes Wissen liegt außerhalb des Repo-Checkouts (12.08.2026)

Deploys machen `git reset --hard`; Änderungen aus dem Wissen-Tab müssen das
überleben. Der Live-Ordner ist `/opt/hey-jesus-data/knowledge`, in den
Container gemountet; der `knowledge/`-Ordner im Repo ist nur die Saat für
Neuinstallationen.
