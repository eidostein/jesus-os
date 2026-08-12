import { GoogleGenAI, Modality } from "@google/genai";
import { config } from "./config.js";
import { VOICE_NAMES } from "./voices.js";

// Round-robin start index so load spreads across the key pool between sessions.
let keyCursor = 0;

const LANGUAGE_CODES = { en: "en-US", de: "de-DE" };

/**
 * Attaches a browser WebSocket to a Gemini Live session.
 *
 * Protocol (browser <-> server):
 *   client -> server  JSON  {type:"start", voice, language}
 *   client -> server  binary PCM16 mono @16kHz (mic audio)
 *   client -> server  JSON  {type:"end"}
 *   server -> client  JSON  {type:"ready"} | {type:"interrupted"} |
 *                           {type:"turnComplete"} |
 *                           {type:"transcript", role:"user"|"model", text} |
 *                           {type:"error", message}
 *   server -> client  binary PCM16 mono @24kHz (model audio)
 */
export function handleVoiceSocket(client, systemInstruction) {
  let session = null;
  let closing = false;

  const sendJson = (obj) => {
    if (client.readyState === client.OPEN) client.send(JSON.stringify(obj));
  };

  const closeSession = () => {
    closing = true;
    try {
      session?.close();
    } catch {
      /* already closed */
    }
    session = null;
  };

  client.on("message", async (data, isBinary) => {
    if (isBinary) {
      // Mic audio frame -> forward to Gemini.
      if (session) {
        try {
          session.sendRealtimeInput({
            audio: { data: data.toString("base64"), mimeType: "audio/pcm;rate=16000" },
          });
        } catch (err) {
          console.error("[live] send failed:", err.message);
        }
      }
      return;
    }

    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }

    if (msg.type === "start" && !session) {
      const voice = VOICE_NAMES.has(msg.voice) ? msg.voice : config.defaultVoice;
      const language = LANGUAGE_CODES[msg.language] || "en-US";
      try {
        session = await connectWithRotation(client, sendJson, { voice, language, systemInstruction });
        sendJson({ type: "ready", voice });
      } catch (err) {
        console.error("[live] all keys failed:", err.message);
        sendJson({ type: "error", message: "The line to heaven is busy right now. Please try again in a moment." });
        client.close();
      }
    } else if (msg.type === "end") {
      closeSession();
      client.close();
    }
  });

  client.on("close", closeSession);
  client.on("error", closeSession);

  async function connectWithRotation(client, sendJson, { voice, language, systemInstruction }) {
    const keys = config.apiKeys;
    if (keys.length === 0) throw new Error("no API keys configured");

    let lastError = null;
    for (let attempt = 0; attempt < keys.length; attempt++) {
      const key = keys[(keyCursor + attempt) % keys.length];
      // The Live API accepts the WebSocket and only then rejects bad keys with
      // an async close — watch for that during a short grace window so we can
      // rotate to the next key instead of surfacing a dead session.
      const setup = { established: false, closed: false, reason: "" };
      try {
        const ai = new GoogleGenAI({ apiKey: key });
        const s = await ai.live.connect({
          model: config.model,
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction,
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
              languageCode: language,
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
          callbacks: {
            onmessage: (m) => {
              if (closing) return;
              if (m.data && client.readyState === client.OPEN) {
                client.send(Buffer.from(m.data, "base64"), { binary: true });
              }
              const sc = m.serverContent;
              if (!sc) return;
              if (sc.interrupted) sendJson({ type: "interrupted" });
              if (sc.inputTranscription?.text) {
                sendJson({ type: "transcript", role: "user", text: sc.inputTranscription.text });
              }
              if (sc.outputTranscription?.text) {
                sendJson({ type: "transcript", role: "model", text: sc.outputTranscription.text });
              }
              if (sc.turnComplete) sendJson({ type: "turnComplete" });
            },
            onerror: (e) => {
              console.error("[live] session error:", e?.message || e);
              sendJson({ type: "error", message: "The connection was lost. Please start again." });
            },
            onclose: (e) => {
              setup.closed = true;
              setup.reason = e?.reason || `code ${e?.code}`;
              if (!closing && setup.established) {
                console.warn(`[live] session closed by server: code=${e?.code} reason=${e?.reason || "n/a"}`);
                sendJson({ type: "error", message: "The conversation ended unexpectedly." });
              }
            },
          },
        });

        // Grace window: fail fast if the server rejects the key right away.
        for (let waited = 0; waited < 1500 && !setup.closed; waited += 100) {
          await new Promise((r) => setTimeout(r, 100));
        }
        if (setup.closed) throw new Error(setup.reason || "closed during setup");

        setup.established = true;
        const keyIndex = (keyCursor + attempt) % keys.length;
        keyCursor = (keyIndex + 1) % keys.length;
        console.log(`[live] session opened (voice=${voice}, lang=${language}, key #${keyIndex})`);
        return s;
      } catch (err) {
        lastError = err;
        console.warn(`[live] key #${(keyCursor + attempt) % keys.length} failed: ${err.message}`);
      }
    }
    throw lastError || new Error("unable to connect");
  }
}
