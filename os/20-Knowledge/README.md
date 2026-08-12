---
title: Where Jesus gets his knowledge — and how to tune him
summary: The knowledge folder explained end to end - what the files do, how to edit them in the Knowledge tab, and what makes tuning work.
category: Knowledge & Tuning
audience: everyone
order: 1
updated: 2026-08-12
---

# Where Jesus gets his knowledge — and how to tune him

Everything Jesus "knows on purpose" lives in **one folder of plain text
files** on the server. No database, no training, no magic: readable files that
anyone on the team can open, edit and understand.

## The mental model

The AI model behind Hey Jesus already speaks every language and has read a
world of text — but it doesn't know *who it is supposed to be*. That is what
the knowledge folder provides. At the start of **every conversation** the
server:

1. reads every `.md` and `.txt` file in the folder, **in alphabetical order**,
2. skips `README.md` (documentation for humans, not for him),
3. joins them into one long text — the **system instruction** — and hands it
   to the model before the visitor's first word.

The system instruction is the model's inner compass: it shapes who he is, how
he speaks, and what he treats as true. It is not a script — he doesn't recite
it — it is closer to *character direction*.

::: good Changes apply immediately
Save a file (in the Knowledge tab or on disk) and the **next conversation**
started on the website already uses it. No restart, no deployment. Running
conversations keep the instruction they started with.
:::

## What is in the folder today

| File | Role |
|---|---|
| `00-persona.md` | Who he is: spirit of the Gospels, honesty about being an AI, boundaries (no medical/legal advice, crisis → real help), never judging |
| `10-conversation-style.md` | Voice-first speaking style: 2–4 sentences, no lists, questions and parables over lectures, hopeful endings |

The numbering is the ordering: `00-` loads before `10-` before `20-`. Persona
first, style second, knowledge after — later files build on earlier ones.

## The Knowledge tab — managing files without touching code

The **Wissen / Knowledge** tab in this dashboard is a live window into that
folder:

- **Read**: click a file to see exactly what Jesus is told.
- **Edit**: change the text, press *Save* — the status line confirms it and
  the change is live for the next conversation.
- **Add**: *New file*, give it a name like `20-comfort-in-grief.md`, write,
  save.
- **Delete**: removes the file; Jesus forgets its content on the next
  conversation.

The meter under the file list shows the **prompt budget**: ~200,000
characters. Files that would push past it are skipped (marked *not loaded*)
— the budget keeps his answers fast.

## What to write — tuning that works

- **Topic guidance** — how he should handle grief, anxiety, marriage,
  forgiveness. Write it as direction, not essays: *"When someone speaks of
  losing a person: first acknowledge, never rush to comfort. Psalm 34:19 and
  John 11:35 fit here."*
- **Scripture packs** — key passages he should quote precisely, with
  references. Public-domain translations (Luther 1912, King James, World
  English Bible) are safe to paste in whole chapters.
- **Persona refinements** — more humour? more gravity? Shorter answers?
  Adjust `10-conversation-style.md`; one clear sentence beats three vague
  ones.
- **Seasonal layers** — an Advent or Easter file added in season, deleted
  after.

Write in German or English (or both) — his answers follow the **visitor's**
language regardless, so write whichever you can review best.

## Limits, honestly

The budget (~200k characters) holds a lot of guidance but **not the whole
Bible** (~4.3M characters). Until the retrieval step ships (see *Plan &
Roadmap*), he quotes from what the model already knows plus what these files
pin down precisely. If a specific verse must always be word-perfect, put that
verse in a file.
