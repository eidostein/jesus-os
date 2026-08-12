import { readFileSync, writeFileSync, unlinkSync, existsSync } from "node:fs";
import { join } from "node:path";
import express from "express";
import { listKnowledge } from "./knowledge.js";

// Knowledge management API for the /os dashboard. Reachable only through
// Caddy's basic-auth-protected /os/api/* route — the public site handle never
// forwards these paths.

const NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._ -]{0,80}\.(md|txt)$/;
const MAX_FILE_BYTES = 512 * 1024;

export function osApiRouter(knowledgeDir) {
  const router = express.Router();

  const safePath = (name) => {
    if (!NAME_RE.test(name) || name.includes("..")) return null;
    return join(knowledgeDir, name);
  };

  router.get("/knowledge", (_req, res) => {
    res.json({ dir: knowledgeDir, ...listKnowledge(knowledgeDir) });
  });

  router.get("/knowledge/file", (req, res) => {
    const p = safePath(String(req.query.name || ""));
    if (!p || !existsSync(p)) return res.status(404).json({ error: "not found" });
    res.type("text/plain; charset=utf-8").send(readFileSync(p, "utf-8"));
  });

  router.put("/knowledge/file", express.text({ limit: MAX_FILE_BYTES, type: "*/*" }), (req, res) => {
    const name = String(req.query.name || "");
    const p = safePath(name);
    if (!p) return res.status(400).json({ error: "invalid name (use letters, digits, . _ - and end in .md or .txt)" });
    const body = typeof req.body === "string" ? req.body : "";
    if (Buffer.byteLength(body, "utf-8") > MAX_FILE_BYTES) {
      return res.status(413).json({ error: "file too large (max 512 KB)" });
    }
    writeFileSync(p, body, "utf-8");
    console.log(`[os] knowledge saved: ${name} (${body.length} chars)`);
    res.json({ ok: true });
  });

  router.delete("/knowledge/file", (req, res) => {
    const name = String(req.query.name || "");
    const p = safePath(name);
    if (!p || !existsSync(p)) return res.status(404).json({ error: "not found" });
    unlinkSync(p);
    console.log(`[os] knowledge deleted: ${name}`);
    res.json({ ok: true });
  });

  return router;
}
