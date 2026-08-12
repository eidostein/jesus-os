import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// System-instruction budget. The Live API accepts large contexts, but keeping
// the instruction lean keeps first-response latency low.
export const MAX_CHARS = 200_000;

const FALLBACK =
  "You are Hey Jesus, a compassionate voice companion inspired by the life and teachings of Jesus of Nazareth.";

/** True for files that are read to the model (everything else is docs for humans). */
const isKnowledgeFile = (name) =>
  (name.endsWith(".md") || name.endsWith(".txt")) && name.toLowerCase() !== "readme.md";

/**
 * Lists the knowledge directory with per-file metadata, marking which files
 * fit the budget (same alphabetical-order rules the loader applies).
 */
export function listKnowledge(dir) {
  let names = [];
  try {
    names = readdirSync(dir).filter((f) => f.endsWith(".md") || f.endsWith(".txt")).sort();
  } catch {
    return { files: [], totalChars: 0, maxChars: MAX_CHARS };
  }
  let used = 0;
  const files = names.map((name) => {
    const st = statSync(join(dir, name));
    const chars = st.size; // bytes ≈ chars for our ASCII-heavy markdown; close enough for a meter
    let loaded = false;
    if (isKnowledgeFile(name) && used + chars <= MAX_CHARS) {
      used += chars;
      loaded = true;
    }
    return { name, chars, mtime: st.mtime.toISOString(), loaded };
  });
  return { files, totalChars: used, maxChars: MAX_CHARS };
}

/**
 * Builds the system instruction from every knowledge file in the directory,
 * in alphabetical order (prefix files with 00-, 10-, ... to control order).
 * Called fresh for every conversation, so Knowledge-tab edits apply to the
 * next session without a restart.
 */
export function loadSystemInstruction(dir) {
  let files = [];
  try {
    files = readdirSync(dir).filter(isKnowledgeFile).sort();
  } catch {
    console.warn(`[knowledge] Directory not found: ${dir}`);
    return FALLBACK;
  }

  let out = "";
  for (const f of files) {
    const text = readFileSync(join(dir, f), "utf-8").trim();
    if (out.length + text.length > MAX_CHARS) {
      console.warn(`[knowledge] Skipping ${f}: system instruction budget (${MAX_CHARS} chars) reached.`);
      continue;
    }
    out += `${text}\n\n`;
  }
  return out.trim() || FALLBACK;
}
