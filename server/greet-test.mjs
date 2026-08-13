import WebSocket from "ws";
const lang = process.argv[2] || "de";
const ws = new WebSocket("ws://localhost:8790/ws");
let audioBytes = 0, transcript = "";
setTimeout(() => finish("timeout"), 30000);
function finish(why){
  const secs = audioBytes / 2 / 24000;
  console.log(JSON.stringify({lang, why, audioSeconds: +secs.toFixed(1), greeting: transcript.trim().slice(0, 160)}));
  process.exit(0);
}
ws.on("open", () => ws.send(JSON.stringify({ type: "start", language: lang })));
ws.on("message", (data, isBinary) => {
  if (isBinary) { audioBytes += data.length; return; }
  const m = JSON.parse(data.toString());
  if (m.type === "transcript" && m.role === "model") transcript += m.text;
  if (m.type === "turnComplete" && audioBytes > 0) setTimeout(() => finish("turnComplete"), 1000);
});
