import { createServer } from "node:http";
import express from "express";
import { WebSocketServer } from "ws";
import { config } from "./config.js";
import { VOICES } from "./voices.js";
import { loadSystemInstruction } from "./knowledge.js";
import { handleVoiceSocket } from "./live-proxy.js";

const systemInstruction = loadSystemInstruction(config.knowledgeDir);

const app = express();
app.disable("x-powered-by");

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", keys: config.apiKeys.length > 0 });
});

app.get("/api/config", (_req, res) => {
  res.json({ voices: VOICES, defaultVoice: config.defaultVoice, model: config.model });
});

// Static frontend (built web app copied into ./public in the Docker image).
app.use(express.static(config.publicDir, { maxAge: "1h", index: "index.html" }));
app.use((_req, res) => {
  res.sendFile("index.html", { root: config.publicDir });
});

const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });
wss.on("connection", (socket) => handleVoiceSocket(socket, systemInstruction));

server.listen(config.port, () => {
  console.log(`[server] Hey Jesus listening on :${config.port} (model=${config.model}, keys=${config.apiKeys.length})`);
});

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    console.log(`[server] ${sig} received, shutting down.`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000).unref();
  });
}
