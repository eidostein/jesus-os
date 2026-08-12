# Knowledge — feeding information to Hey Jesus

Every `.md` file in this directory (except this README) is loaded into the
model's system instruction when the server starts, in **alphabetical order**.
Use numeric prefixes to control ordering:

```
00-persona.md              # who Jesus is, boundaries, safety
10-conversation-style.md   # voice-first speaking style
20-<your-topic>.md         # anything you want him to know
```

## Adding knowledge

Drop a new `.md` file here and restart the app (`docker compose up -d --build`
on the server, or the CI/CD pipeline does it on every push to `main`).

Ideas:

- **Scripture**: add key passages, psalms, or whole books (public-domain
  translations like the World English Bible or KJV are safe to include).
- **Themes**: guidance on specific topics — grief, marriage, forgiveness,
  anxiety — written the way you want him to handle them.
- **Seasonal**: Advent, Lent, Easter reflections.

## Limits

The loader caps the combined instruction at ~200k characters and skips files
that would exceed it (you'll see a warning in the server logs). The entire
Bible (~4.3M characters) does not fit in a system instruction — for full-Bible
grounding, the roadmap is a retrieval step (RAG) that fetches relevant
passages per conversation turn. Until then, curated excerpts work very well.
