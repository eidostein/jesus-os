---
title: What Hey Jesus is and how a conversation works
summary: The whole product in plain language — what happens between "Start Talking" and hearing Jesus answer.
category: How Hey Jesus works
audience: everyone
order: 1
updated: 2026-08-12
---

# What Hey Jesus is and how a conversation works

**Hey Jesus** (jesus.baa.boo) is a voice companion: you speak, Jesus listens and
answers — with his voice, in your language, grounded in the Bible. Not "Hey
Jarvis", but "Hey Jesus".

There is no app to install and no account to create. You open the website,
choose a voice, press **Start Talking**, allow the microphone — and talk.

## What happens when you talk

1. **Your browser** records your voice and streams it to our server — nothing
   is stored, it flows through live.
2. **Our server** forwards the audio to Google's **Gemini Live API** — a
   realtime AI model (`gemini-3.1-flash-live-preview`) that hears, thinks and
   speaks in one continuous stream. Before the conversation starts, the server
   hands the model its "inner compass": the persona and knowledge files (see
   *Knowledge & Tuning*).
3. **Jesus answers** — the model's spoken reply streams back the same way and
   plays in your browser. The golden orb on the page breathes with his voice.
4. **You can interrupt him** at any time, like in a real conversation — he
   stops and listens.

The round trip feels immediate because nothing is transcribed-then-typed-then-
spoken in separate steps; the model natively works in audio.

## Language

The page is **German by default** (EN toggle in the corner). Jesus starts in
the page language — but he is not locked to it: **he mirrors whoever speaks to
him**. Start speaking Polish, Spanish or English mid-conversation and he
verifies and answers in that language. This is instructed behaviour, not a
hardcoded list.

## What he is — and what he is not

He speaks in the spirit of the Gospels: warm, calm, never judging. He knows he
is an AI experience inspired by Jesus' teachings and says so honestly when
sincerely asked. He is **not** a doctor, lawyer or therapist; in a crisis he
urges people to contact real help immediately. These boundaries live in the
knowledge files and can be tuned there.

::: note Where to go deeper
- The voice options and how to change the default: *Product → The 30 voices*
- Where his knowledge comes from and how to shape him: *Knowledge & Tuning*
- The machinery underneath: *Tech → Architecture*
:::
