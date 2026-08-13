import { existsSync } from "node:fs";

const keys = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "")
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);

// Docker copies knowledge/ next to src/; in the repo it sits one level higher.
const knowledgeDir =
  process.env.KNOWLEDGE_DIR ||
  [new URL("../knowledge", import.meta.url), new URL("../../knowledge", import.meta.url)]
    .map((u) => u.pathname)
    .find((p) => existsSync(p));

export const config = {
  port: Number(process.env.PORT) || 8790,
  apiKeys: keys,
  model: process.env.GEMINI_LIVE_MODEL || "gemini-3.1-flash-live-preview",
  defaultVoice: process.env.DEFAULT_VOICE || "Algieba",
  knowledgeDir,
  publicDir: new URL("../public", import.meta.url).pathname,
};

if (config.apiKeys.length === 0) {
  console.warn("[config] No GEMINI_API_KEYS set — voice sessions will fail until configured.");
}
