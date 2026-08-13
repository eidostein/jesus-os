---
title: Decision log
summary: Every decision that shaped the system, with its reasoning - so nothing gets re-litigated.
category: Operating
audience: team
order: 1
updated: 2026-08-12
---

# Decision log

One entry per decision, newest last. A decision stands until a dated entry
supersedes it.

## D1 — Gemini native voice, not ElevenLabs (2026-08-12)

The partner offered to pay for a premium ElevenLabs account. Decided against,
for product reasons rather than cost:

- **The voice is the model.** Gemini Live hears, thinks and speaks in one
  stream. An external voice would force speech→text→speech stitching: roughly
  doubled latency, no natural interruption, tone detached from meaning.
- **30 voices are included** — deep and calm ones among them (Charon,
  Enceladus, Iapetus) that suit Jesus well; visitors can choose their own.
- **One provider, one bill, one failure mode.** No second subscription, no
  second quota to exhaust mid-conversation.

Revisit only if a voice test with real users shows the native voices are the
weak link — the architecture would then put a TTS stage behind the same
server proxy.

## D2 — German-first everywhere (2026-08-12)

Page loads in German; Jesus opens in German; EN toggle for both. The core
audience is German-speaking. His language is not pinned though — see D3.

## D3 — Language instructed, not pinned (2026-08-12)

No `languageCode` in the Live API speech config. The UI language enters the
system instruction as a starting preference, plus the standing rule: mirror
the language the visitor speaks. One mechanism covers the toggle, mid-
conversation switches, and languages the UI doesn't even offer.

## D4 — Fresh git history for the public repo (2026-08-12)

jesus-os was built inside the (proprietary) Segnals trading-platform repo.
The GitHub repo got a brand-new history: not one commit of trading code,
strategy docs or credentials can leak — because they were never in it.

## D5 — API keys pooled server-side with rotation (2026-08-12)

The browser talks only to our WebSocket; the server holds the 10-key pool and
rotates on failure. Two of the supplied keys turned out dead on arrival —
rotation absorbed that without a visible error, which is exactly the point.

## D6 — /os inherits the segnals-os engine (2026-08-12)

Same dashboard.html engine, build.py, bilingual docs convention
(`name.md` + `name.de.md`), scoring rules and basic-auth practice (hash in
env, never in git). Proven system, zero relearning cost. Additions: a
Knowledge tab (live file management) and the gold theme.

## D8 — Algieba is the Jesus voice; pace directed via instruction (2026-08-13)

The partner listened to the candidates and chose **Algieba** (smooth · calm)
as the default. The requested slower, calmer, more relaxed delivery is done
through the style instruction (`10-conversation-style.md`), not a config
switch — the Live API exposes no speaking-rate parameter, and native-audio
models follow prompt-level pacing direction well. Visitors can still pick any
of the 30 voices per conversation.

## D7 — Live knowledge lives outside the repo checkout (2026-08-12)

Deploys run `git reset --hard`; edits made in the Knowledge tab must survive
deploys. The live folder is `/opt/hey-jesus-data/knowledge`, mounted into the
container; the repo's `knowledge/` folder is only the seed for new installs.
