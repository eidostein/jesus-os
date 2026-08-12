import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// System-instruction budget. The Live API accepts large contexts, but keeping
// the instruction lean keeps first-response latency low.
const MAX_CHARS = 200_000;

/**
 * Builds the system instruction from every .md file in the knowledge
 * directory, in alphabetical order (prefix files with 00-, 10-, ... to
 * control ordering). README.md is documentation for humans and is skipped.
 */
export function loadSystemInstruction(dir) {
  let files = [];
  try {
    files = readdirSync(dir)
      .filter((f) => f.endsWith(".md") && f.toLowerCase() !== "readme.md")
      .sort();
  } catch {
    console.warn(`[knowledge] Directory not found: ${dir}`);
    return "You are Hey Jesus, a compassionate voice companion inspired by the life and teachings of Jesus of Nazareth.";
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
  console.log(`[knowledge] Loaded ${files.length} file(s), ${out.length} chars.`);
  return out.trim();
}
