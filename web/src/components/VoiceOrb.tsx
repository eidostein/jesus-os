import { useEffect, useRef } from "react";

interface VoiceOrbProps {
  /** Called every frame; return current audio levels (0..1). */
  getLevels: () => { mic: number; out: number };
  active: boolean;
}

/* ── Look & feel ──────────────────────────────────────────────────────────────
   Every constant here is a design dial — the orb is hand-drawn on a canvas,
   not a library widget, so shape, density, colour and motion are all editable.
   Reference: the amber "sound-wave nebula" mockup — wavy particle bands in a
   lens silhouette, radial streaks, white-hot starburst core, two glowing arcs.
   ────────────────────────────────────────────────────────────────────────── */
const LENS_WIDTH = 2.1; // half-width of the lens, in units of `base`
const LENS_HEIGHT = 1.0; // half-height at the centre
const LENS_TAPER = 0.75; // >0; higher = sharper points at the tips
const RING_COUNT = 13; // wavy concentric bands that build the mesh
const RING_SEGMENTS = 110; // smoothness of each band
const DUST_COUNT = 1500; // loose shimmering dust on top of the bands
const STREAK_COUNT = 22; // fine radial rays leaving the core
// Palette from the mockup: saturated amber-orange embers on near-black.
const CORE = "255, 243, 216";
const GOLD = "255, 172, 64";
const GOLD_DEEP = "236, 126, 26";
const EMBER = "196, 84, 10";

interface Dust {
  r: number;
  theta: number;
  size: number;
  speed: number;
  twinkle: number;
}

/**
 * The golden voice orb — wavy bands of amber light in a lens shape that
 * breathe with the conversation: they swell and brighten when Jesus speaks
 * and shimmer as you speak.
 */
export function VoiceOrb({ getLevels, active }: VoiceOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const getLevelsRef = useRef(getLevels);
  getLevelsRef.current = getLevels;
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let smoothOut = 0;
    let smoothMic = 0;

    const small = canvas.clientWidth < 520;

    // Each band gets its own wave signature so the mesh looks organic.
    const rings = Array.from({ length: RING_COUNT }, (_, i) => ({
      r: 0.18 + (i / (RING_COUNT - 1)) * 0.82,
      waves: 3 + Math.floor(Math.random() * 4),
      phase: Math.random() * Math.PI * 2,
      drift: (0.08 + Math.random() * 0.12) * (Math.random() < 0.5 ? -1 : 1),
      amp: 0.05 + Math.random() * 0.09,
    }));

    // Two dust populations: a dense haze around the core plus spread sparkle
    // reaching into the wings — that mix is what makes the mockup feel full.
    const dust: Dust[] = Array.from({ length: small ? DUST_COUNT / 2 : DUST_COUNT }, (_, i) => ({
      r: Math.pow(Math.random(), i % 3 === 0 ? 0.5 : 1.25),
      theta: Math.random() * Math.PI * 2,
      size: 0.4 + Math.random() * 1.6,
      speed: 0.05 + Math.random() * 0.12,
      twinkle: Math.random() * Math.PI * 2,
    }));

    // Fixed random angles/lengths so the starburst doesn't flicker randomly.
    const streaks = Array.from({ length: STREAK_COUNT }, () => ({
      angle: Math.random() * Math.PI * 2,
      len: 0.25 + Math.random() * 0.55,
      alpha: 0.25 + Math.random() * 0.4,
    }));

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { clientWidth, clientHeight } = canvas;
      canvas.width = clientWidth * dpr;
      canvas.height = clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    let t = 0;
    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const cx = w / 2;
      const cy = h / 2;
      const base = Math.min(w / (LENS_WIDTH * 2.5), h / 2.35);
      t += 0.016;

      const { mic, out } = getLevelsRef.current();
      smoothOut += (Math.min(out * 3, 1) - smoothOut) * 0.12;
      smoothMic += (Math.min(mic * 4, 1) - smoothMic) * 0.15;
      const energy = activeRef.current ? Math.max(smoothOut, smoothMic * 0.6) : 0;
      const breathe = 1 + Math.sin(t * 0.7) * 0.02 + energy * 0.22;

      const halfW = base * LENS_WIDTH * breathe;
      const halfH = base * LENS_HEIGHT * breathe;

      // Vertical squeeze towards the lens tips — the pointed-eye silhouette.
      const envelope = (u: number) => Math.pow(Math.max(0, 1 - u * u), LENS_TAPER);

      ctx.clearRect(0, 0, w, h);

      // ── Ember glow behind everything ───────────────────────────────────
      const glowR = base * (1.1 + energy * 0.5) * breathe;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      glow.addColorStop(0, `rgba(${GOLD}, ${0.5 + energy * 0.3})`);
      glow.addColorStop(0.25, `rgba(${GOLD_DEEP}, ${0.22 + energy * 0.2})`);
      glow.addColorStop(0.6, `rgba(${EMBER}, 0.08)`);
      glow.addColorStop(1, `rgba(${EMBER}, 0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // ── Faint dotted outer circle ──────────────────────────────────────
      ctx.save();
      ctx.setLineDash([1.5, 8]);
      ctx.beginPath();
      ctx.arc(cx, cy, base * 1.42 * breathe, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${GOLD_DEEP}, ${0.18 + energy * 0.1})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // ── Wavy bands: the mesh that forms the lens ───────────────────────
      // Drawn as faint polylines with particles sitting on them; wave motion
      // drifts slowly and deepens with his voice.
      for (const ring of rings) {
        const wobble = ring.amp * (1 + energy * 1.6) * base;
        ctx.beginPath();
        for (let s = 0; s <= RING_SEGMENTS; s++) {
          const theta = (s / RING_SEGMENTS) * Math.PI * 2;
          const u = ring.r * Math.cos(theta);
          const v = ring.r * Math.sin(theta);
          const wave =
            (Math.sin(theta * ring.waves + ring.phase + t * ring.drift * 4) +
              0.45 * Math.sin(theta * ring.waves * 2.6 + ring.phase * 3 + t * ring.drift * 2)) *
            wobble *
            ring.r;
          const x = cx + u * halfW;
          const y = cy + (v * halfH + wave) * envelope(u);
          s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(${GOLD_DEEP}, ${(0.16 - ring.r * 0.08) * (1 + energy)})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();

        // Beads of light along the band, brighter near the core.
        const beads = Math.floor(RING_SEGMENTS / 1.6);
        for (let b = 0; b < beads; b++) {
          const theta = (b / beads) * Math.PI * 2 + ring.phase;
          const u = ring.r * Math.cos(theta);
          const v = ring.r * Math.sin(theta);
          const wave =
            Math.sin(theta * ring.waves + ring.phase + t * ring.drift * 4) * wobble * ring.r;
          const x = cx + u * halfW;
          const y = cy + (v * halfH + wave) * envelope(u);
          const tw = 0.55 + 0.45 * Math.sin(t * 1.8 + b * 1.7 + ring.phase);
          const alpha = (1 - ring.r * 0.55) * tw * (0.55 + energy * 0.45);
          ctx.beginPath();
          ctx.arc(x, y, (ring.r < 0.45 ? 1.6 : 1.1) * (1 + energy * 0.35), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${GOLD}, ${Math.max(0, Math.min(1, alpha))})`;
          ctx.fill();
        }
      }

      // ── Loose dust for sparkle ─────────────────────────────────────────
      const spin = 0.35 + energy * 1.6;
      for (const p of dust) {
        p.theta += p.speed * 0.016 * spin;
        const u = p.r * Math.cos(p.theta);
        const v = p.r * Math.sin(p.theta);
        const x = cx + u * halfW;
        const y = cy + v * halfH * envelope(u);
        const tw = 0.5 + 0.5 * Math.sin(t * 2 + p.twinkle);
        const alpha = (1 - p.r * 0.5) * tw * (0.5 + energy * 0.4);
        ctx.beginPath();
        ctx.arc(x, y, p.size * (1 + energy * 0.3), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${GOLD}, ${Math.max(0, Math.min(1, alpha))})`;
        ctx.fill();
      }

      // ── Radial streaks out of the core ─────────────────────────────────
      ctx.lineWidth = 0.8;
      for (const s of streaks) {
        const len = base * s.len * (1 + energy * 0.5);
        const ex = cx + Math.cos(s.angle) * len * 1.4; // stretched horizontally
        const ey = cy + Math.sin(s.angle) * len * 0.8;
        const g = ctx.createLinearGradient(cx, cy, ex, ey);
        g.addColorStop(0, `rgba(${CORE}, ${s.alpha * (0.8 + energy * 0.4)})`);
        g.addColorStop(0.4, `rgba(${GOLD}, ${s.alpha * 0.4})`);
        g.addColorStop(1, `rgba(${GOLD_DEEP}, 0)`);
        ctx.strokeStyle = g;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      }

      // ── Two glowing arcs, slowly turning ───────────────────────────────
      const ringR = base * 1.18 * breathe;
      const drift = t * 0.05;
      ctx.save();
      ctx.shadowColor = `rgba(${GOLD_DEEP}, 0.9)`;
      ctx.shadowBlur = 12 + energy * 10;
      ctx.lineWidth = 2.6;
      ctx.lineCap = "round";
      ctx.strokeStyle = `rgba(${GOLD}, ${0.8 + energy * 0.2})`;
      for (const from of [0.1, 1.1]) {
        ctx.beginPath();
        ctx.arc(cx, cy, ringR, (from + drift) * Math.PI, (from + 0.74 + drift) * Math.PI);
        ctx.stroke();
      }
      ctx.restore();

      // ── White-hot core ─────────────────────────────────────────────────
      const coreR = base * (0.16 + energy * 0.08);
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      core.addColorStop(0, `rgba(${CORE}, 1)`);
      core.addColorStop(0.35, `rgba(${GOLD}, ${0.75 + energy * 0.25})`);
      core.addColorStop(1, `rgba(${GOLD_DEEP}, 0)`);
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="h-full w-full" aria-hidden="true" />;
}
