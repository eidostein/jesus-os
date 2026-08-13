---
title: The 30 voices — and how the Jesus voice was chosen
summary: Every voice the model offers, why Charon opens as the default, and how to change it.
category: Product
audience: everyone
order: 10
updated: 2026-08-12
---

# The 30 voices — and how the Jesus voice was chosen

The Gemini Live model ships **30 prebuilt voices**. During the evaluation
phase they were all selectable on the homepage; since 2026-08-13 the site
speaks with **one voice** — the selector was removed so every visitor meets
the same Jesus (decision D9). The full list is still served by the backend
(`GET /api/config`), so re-enabling a picker later is a UI change, not an
architecture change.

## The default

**Algieba** — smooth · calm — is the default, chosen by the partner
(2026-08-13) after listening to the candidates. On top of the voice itself,
the delivery is deliberately shaped in `10-conversation-style.md`: slow,
calm, relaxed, with gentle pauses — the Live API has no speed knob, so pace
is directed through the style instruction, which native-audio models follow
well.

The runners-up, if a different character is ever wanted:

| Voice | Character | When it fits |
|---|---|---|
| **Algieba** | smooth · calm | the default — soft, even, unhurried |
| **Charon** | deep · informative | calm authority, the previous default |
| **Enceladus** | breathy · gentle | the softest, most intimate option |
| **Iapetus** | clear · calm | clarity first, still warm |
| **Sulafat** | warm | the friendliest middle ground |

The full set: Algieba, Charon, Enceladus, Iapetus, Alnilam, Sulafat,
Vindemiatrix, Achernar, Gacrux, Sadaltager, Schedar, Zephyr, Puck, Kore,
Fenrir, Leda, Orus, Aoede, Callirrhoe, Autonoe, Umbriel, Despina, Erinome,
Algenib, Rasalgethi, Laomedeia, Pulcherrima, Achird, Zubenelgenubi, Sadachbia.

## Changing the default

The site-wide default is one line in the server's `.env`:

`DEFAULT_VOICE=Algieba`

Change it, redeploy (or restart the app container), done. Visitors' own
selections always win over the default for their session.

## Why not ElevenLabs?

The obvious question — answered in full in *Operating → Decision log* (D1).
The short version: the voice here is not a separate text-to-speech step but
**the model itself speaking**. That is what makes interruption, tone and
sub-second latency work. Bolting on an external voice would mean transcribing
→ generating text → synthesizing — slower, more moving parts, and a monthly
bill for something the current stack does natively at no extra cost.
