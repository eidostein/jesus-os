import WebSocket from "ws";
import { readFileSync } from "fs";
const wav = readFileSync("/tmp/q.wav");
const pcm = Buffer.concat([wav.subarray(44), Buffer.alloc(96000)]);
const ws = new WebSocket("wss://jesus.baa.boo/ws");
let audioBytes = 0, transcript = "", lastAudio = 0;
const started = Date.now();
setTimeout(() => finish("timeout"), 45000);
function finish(why){
  const secs = audioBytes / 2 / 24000;
  const words = transcript.trim().split(/\s+/).filter(Boolean).length;
  console.log(JSON.stringify({why, audioSeconds: +secs.toFixed(1), words, wpm: secs > 0 ? Math.round(words / (secs/60)) : 0, transcript: transcript.trim().slice(0,150)}));
  process.exit(0);
}
ws.on("open", () => ws.send(JSON.stringify({ type: "start", language: "en" })));
ws.on("message", (data, isBinary) => {
  if (isBinary) { audioBytes += data.length; lastAudio = Date.now(); return; }
  const m = JSON.parse(data.toString());
  if (m.type === "transcript" && m.role === "model") transcript += m.text;
  if (m.type === "ready") {
    let off = 0;
    const iv = setInterval(() => {
      if (off >= pcm.length) { clearInterval(iv); return; }
      ws.send(pcm.subarray(off, off + 3200)); off += 3200;
    }, 100);
  }
  if (m.type === "turnComplete" && audioBytes > 0) setTimeout(() => finish("turnComplete"), 1500);
});
