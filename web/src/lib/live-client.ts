/**
 * LiveClient — browser side of the Hey Jesus voice pipeline.
 *
 * Mic (getUserMedia) → AudioWorklet (resample to 16kHz PCM16) → WebSocket /ws
 * WebSocket /ws → PCM16 @24kHz chunks → scheduled AudioBufferSources → speakers
 */

export type LiveStatus = "idle" | "connecting" | "live" | "error";

export interface TranscriptEntry {
  role: "user" | "model";
  text: string;
}

export interface LiveClientEvents {
  onStatus: (status: LiveStatus, detail?: string) => void;
  onTranscript: (entry: TranscriptEntry) => void;
}

// Runs inside the AudioWorklet scope: resamples the mic input to 16kHz and
// posts Int16 PCM plus an RMS level per block.
const CAPTURE_WORKLET = `
class PCMCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / 16000;
    this.readPos = 0;
    this.carry = new Float32Array(0);
  }
  process(inputs) {
    const input = inputs[0] && inputs[0][0];
    if (!input || input.length === 0) return true;

    let sum = 0;
    for (let i = 0; i < input.length; i++) sum += input[i] * input[i];
    this.port.postMessage({ type: "level", value: Math.sqrt(sum / input.length) });

    const data = new Float32Array(this.carry.length + input.length);
    data.set(this.carry, 0);
    data.set(input, this.carry.length);

    const out = [];
    let pos = this.readPos;
    while (pos + 1 < data.length) {
      const i0 = Math.floor(pos);
      const frac = pos - i0;
      out.push(data[i0] * (1 - frac) + data[i0 + 1] * frac);
      pos += this.ratio;
    }
    const consumed = Math.floor(pos);
    this.readPos = pos - consumed;
    this.carry = data.slice(consumed);

    if (out.length) {
      const pcm = new Int16Array(out.length);
      for (let i = 0; i < out.length; i++) {
        const s = Math.max(-1, Math.min(1, out[i]));
        pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      this.port.postMessage({ type: "audio", data: pcm.buffer }, [pcm.buffer]);
    }
    return true;
  }
}
registerProcessor("pcm-capture", PCMCaptureProcessor);
`;

const SEND_CHUNK_SAMPLES = 1600; // 100ms of 16kHz audio per WS frame
const OUTPUT_RATE = 24000;

export class LiveClient {
  private ws: WebSocket | null = null;
  private ctx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private micNode: AudioWorkletNode | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private analyserData: Uint8Array<ArrayBuffer> | null = null;
  private outGain: GainNode | null = null;
  private playTime = 0;
  private playing = new Set<AudioBufferSourceNode>();
  private sendBuffer: Int16Array[] = [];
  private sendBuffered = 0;
  private micLevel = 0;
  private events: LiveClientEvents;

  status: LiveStatus = "idle";

  constructor(events: LiveClientEvents) {
    this.events = events;
  }

  private setStatus(s: LiveStatus, detail?: string) {
    this.status = s;
    this.events.onStatus(s, detail);
  }

  /** Combined levels for the orb: mic input and model speech output, 0..1. */
  getLevels(): { mic: number; out: number } {
    let out = 0;
    if (this.analyser && this.analyserData) {
      this.analyser.getByteTimeDomainData(this.analyserData);
      let sum = 0;
      for (let i = 0; i < this.analyserData.length; i++) {
        const v = (this.analyserData[i] - 128) / 128;
        sum += v * v;
      }
      out = Math.sqrt(sum / this.analyserData.length);
    }
    return { mic: this.micLevel, out };
  }

  async start(language: string): Promise<void> {
    if (this.status === "connecting" || this.status === "live") return;
    this.setStatus("connecting");
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.ctx = new AudioContext();
      await this.ctx.resume();
      const workletUrl = URL.createObjectURL(
        new Blob([CAPTURE_WORKLET], { type: "application/javascript" })
      );
      await this.ctx.audioWorklet.addModule(workletUrl);
      URL.revokeObjectURL(workletUrl);

      this.outGain = this.ctx.createGain();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyserData = new Uint8Array(this.analyser.fftSize);
      this.outGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      await this.openSocket(language);

      this.micSource = this.ctx.createMediaStreamSource(this.micStream);
      this.micNode = new AudioWorkletNode(this.ctx, "pcm-capture");
      this.micNode.port.onmessage = (e) => {
        if (e.data.type === "level") {
          this.micLevel = e.data.value;
        } else if (e.data.type === "audio") {
          this.queueMicAudio(new Int16Array(e.data.data));
        }
      };
      this.micSource.connect(this.micNode);

      this.setStatus("live");
    } catch (err) {
      this.stop();
      const message =
        err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "NotFoundError")
          ? "mic"
          : "connect";
      this.setStatus("error", message);
    }
  }

  private openSocket(language: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const proto = location.protocol === "https:" ? "wss" : "ws";
      const ws = new WebSocket(`${proto}://${location.host}/ws`);
      ws.binaryType = "arraybuffer";
      this.ws = ws;

      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error("timeout"));
      }, 15000);

      // No voice field: the server chooses its configured default voice.
      ws.onopen = () => ws.send(JSON.stringify({ type: "start", language }));
      ws.onmessage = (e) => {
        if (typeof e.data === "string") {
          const msg = JSON.parse(e.data);
          if (msg.type === "ready") {
            clearTimeout(timeout);
            resolve();
          } else if (msg.type === "interrupted") {
            this.flushPlayback();
          } else if (msg.type === "transcript") {
            this.events.onTranscript({ role: msg.role, text: msg.text });
          } else if (msg.type === "error") {
            clearTimeout(timeout);
            this.stop();
            this.setStatus("error", "server");
          }
        } else {
          this.schedulePlayback(e.data as ArrayBuffer);
        }
      };
      ws.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("ws error"));
      };
      ws.onclose = () => {
        clearTimeout(timeout);
        if (this.status === "live") {
          this.stop();
          this.setStatus("idle");
        }
      };
    });
  }

  private queueMicAudio(chunk: Int16Array) {
    this.sendBuffer.push(chunk);
    this.sendBuffered += chunk.length;
    if (this.sendBuffered >= SEND_CHUNK_SAMPLES && this.ws?.readyState === WebSocket.OPEN) {
      const merged = new Int16Array(this.sendBuffered);
      let off = 0;
      for (const c of this.sendBuffer) {
        merged.set(c, off);
        off += c.length;
      }
      this.sendBuffer = [];
      this.sendBuffered = 0;
      this.ws.send(merged.buffer);
    }
  }

  private schedulePlayback(buf: ArrayBuffer) {
    if (!this.ctx || !this.outGain) return;
    const i16 = new Int16Array(buf);
    if (i16.length === 0) return;
    const audioBuffer = this.ctx.createBuffer(1, i16.length, OUTPUT_RATE);
    const f32 = audioBuffer.getChannelData(0);
    for (let i = 0; i < i16.length; i++) f32[i] = i16[i] / 32768;

    const src = this.ctx.createBufferSource();
    src.buffer = audioBuffer;
    src.connect(this.outGain);
    const t = Math.max(this.ctx.currentTime + 0.08, this.playTime);
    src.start(t);
    this.playTime = t + audioBuffer.duration;
    this.playing.add(src);
    src.onended = () => this.playing.delete(src);
  }

  /** Called when the model is interrupted — drop everything still scheduled. */
  private flushPlayback() {
    for (const src of this.playing) {
      try {
        src.stop();
      } catch {
        /* not started yet */
      }
    }
    this.playing.clear();
    this.playTime = 0;
  }

  stop() {
    if (this.ws) {
      try {
        if (this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ type: "end" }));
        this.ws.close();
      } catch {
        /* already closed */
      }
      this.ws = null;
    }
    this.flushPlayback();
    this.micNode?.disconnect();
    this.micSource?.disconnect();
    this.micStream?.getTracks().forEach((t) => t.stop());
    this.ctx?.close().catch(() => {});
    this.micNode = null;
    this.micSource = null;
    this.micStream = null;
    this.ctx = null;
    this.outGain = null;
    this.analyser = null;
    this.micLevel = 0;
    this.sendBuffer = [];
    this.sendBuffered = 0;
    if (this.status !== "error") this.setStatus("idle");
  }
}
