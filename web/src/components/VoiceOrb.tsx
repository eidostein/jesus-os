import { useEffect, useRef } from "react";

interface VoiceOrbProps {
  /** Called every frame; return current audio levels (0..1). */
  getLevels: () => { mic: number; out: number };
  active: boolean;
}

interface Particle {
  /** Position inside the unit disc, before the lens envelope is applied. */
  r: number;
  theta: number;
  size: number;
  speed: number;
  twinkle: number;
}

/* ── Look & feel ──────────────────────────────────────────────────────────────
   Every constant here is a design dial — the orb is hand-drawn on a canvas,
   not a library widget, so shape, density, colour and motion are all editable.
   ────────────────────────────────────────────────────────────────────────── */
const LENS_WIDTH = 2.05; // half-width of the lens, in units of `base`
const LENS_HEIGHT = 0.92; // half-height at the centre
const LENS_TAPER = 0.7; // >0; higher = sharper points at the tips
const DUST_COUNT = 950; // fine shimmering dust (halved on small screens)
const NODE_COUNT = 78; // brighter dots that get constellation lines
const LINK_DISTANCE = 0.4; // max link length, in units of `base`
const GOLD = "255, 205, 120";
const GOLD_DEEP = "232, 168, 74";

/**
 * The golden particle orb — a lens-shaped constellation of light that breathes
 * with the conversation: it swells and brightens when Jesus speaks and
 * shimmers as you speak.
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

    const make = (count: number, minSize: number, maxSize: number): Particle[] =>
      Array.from({ length: count }, () => ({
        // Slight centre weighting so the core reads denser than the rim.
        r: Math.pow(Math.random(), 0.55),
        theta: Math.random() * Math.PI * 2,
        size: minSize + Math.random() * (maxSize - minSize),
        speed: 0.05 + Math.random() * 0.13,
        twinkle: Math.random() * Math.PI * 2,
      }));

    const small = canvas.clientWidth < 520;
    const dust = make(small ? DUST_COUNT / 2 : DUST_COUNT, 0.4, 1.5);
    const nodes = make(small ? NODE_COUNT * 0.7 : NODE_COUNT, 1.1, 2.2);
    const nx: number[] = [];
    const ny: number[] = [];
    const na: number[] = [];

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
      // Fit the lens to the shorter axis so it never overflows its frame.
      const base = Math.min(w / (LENS_WIDTH * 2.5), h / 2.35);
      t += 0.016;

      const { mic, out } = getLevelsRef.current();
      smoothOut += (Math.min(out * 3, 1) - smoothOut) * 0.12;
      smoothMic += (Math.min(mic * 4, 1) - smoothMic) * 0.15;
      const energy = activeRef.current ? Math.max(smoothOut, smoothMic * 0.6) : 0;
      // Idle breathing, plus a swell that follows his voice.
      const breathe = 1 + Math.sin(t * 0.7) * 0.022 + energy * 0.24;
      const spin = 0.35 + energy * 1.6;

      const halfW = base * LENS_WIDTH * breathe;
      const halfH = base * LENS_HEIGHT * breathe;

      /** Maps a particle from the unit disc into the pointed lens silhouette. */
      const project = (p: Particle) => {
        const u = p.r * Math.cos(p.theta);
        const v = p.r * Math.sin(p.theta);
        const envelope = Math.pow(Math.max(0, 1 - u * u), LENS_TAPER);
        return { x: cx + u * halfW, y: cy + v * halfH * envelope, edge: Math.abs(u) };
      };

      ctx.clearRect(0, 0, w, h);

      // ── Core glow ──────────────────────────────────────────────────────
      const glowR = base * (1.05 + energy * 0.55) * breathe;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      glow.addColorStop(0, `rgba(${GOLD}, ${0.62 + energy * 0.3})`);
      glow.addColorStop(0.18, `rgba(${GOLD_DEEP}, ${0.3 + energy * 0.22})`);
      glow.addColorStop(0.55, "rgba(190, 130, 50, 0.08)");
      glow.addColorStop(1, "rgba(190, 130, 50, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // ── Faint dashed outer circle ──────────────────────────────────────
      ctx.save();
      ctx.setLineDash([2, 7]);
      ctx.beginPath();
      ctx.arc(cx, cy, base * 1.3 * breathe, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${GOLD_DEEP}, ${0.16 + energy * 0.1})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // ── Bright ring, drawn as two arcs with gaps and slowly turning ────
      const ringR = base * 1.14 * breathe;
      const drift = t * 0.05;
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = `rgba(${GOLD}, ${0.55 + energy * 0.35})`;
      for (const from of [0.12, 1.12]) {
        ctx.beginPath();
        ctx.arc(cx, cy, ringR, (from + drift) * Math.PI, (from + 0.76 + drift) * Math.PI);
        ctx.stroke();
      }

      // ── Constellation: nodes first, so their links sit under the dust ──
      nodes.forEach((p, i) => {
        p.theta += p.speed * 0.016 * spin;
        const { x, y, edge } = project(p);
        nx[i] = x;
        ny[i] = y;
        na[i] = (1 - edge * 0.55) * (0.5 + 0.5 * Math.sin(t * 1.6 + p.twinkle));
      });

      const maxLink = base * LINK_DISTANCE;
      ctx.lineWidth = 0.7;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nx[i] - nx[j];
          const dy = ny[i] - ny[j];
          const d = Math.hypot(dx, dy);
          if (d > maxLink) continue;
          const alpha = (1 - d / maxLink) * 0.42 * (0.6 + energy * 0.7);
          ctx.strokeStyle = `rgba(${GOLD_DEEP}, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(nx[i], ny[i]);
          ctx.lineTo(nx[j], ny[j]);
          ctx.stroke();
        }
      }

      for (let i = 0; i < nodes.length; i++) {
        ctx.beginPath();
        ctx.arc(nx[i], ny[i], nodes[i].size * (1 + energy * 0.35), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${GOLD}, ${Math.min(1, na[i] * (0.75 + energy * 0.5))})`;
        ctx.fill();
      }

      // ── Dust ───────────────────────────────────────────────────────────
      for (const p of dust) {
        p.theta += p.speed * 0.016 * spin;
        const { x, y, edge } = project(p);
        const tw = 0.55 + 0.45 * Math.sin(t * 2 + p.twinkle);
        const alpha = (1 - edge * 0.35) * tw * (0.6 + energy * 0.4);
        ctx.beginPath();
        ctx.arc(x, y, p.size * (1 + energy * 0.3), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240, 196, 120, ${Math.max(0, Math.min(1, alpha))})`;
        ctx.fill();
      }

      // ── Star at the centre: bright point plus four soft rays ───────────
      // Kept short and faint on purpose: a glow with a hint of flare, not a
      // sparkle badge.
      const rayLen = base * (0.3 + energy * 0.35);
      ctx.lineWidth = 1;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const g = ctx.createLinearGradient(cx, cy, cx + dx * rayLen, cy + dy * rayLen);
        g.addColorStop(0, `rgba(255, 236, 190, ${0.32 + energy * 0.35})`);
        g.addColorStop(1, "rgba(255, 236, 190, 0)");
        ctx.strokeStyle = g;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + dx * rayLen, cy + dy * rayLen);
        ctx.stroke();
      }
      const starR = base * (0.055 + energy * 0.05);
      const star = ctx.createRadialGradient(cx, cy, 0, cx, cy, starR);
      star.addColorStop(0, "rgba(255, 249, 232, 0.95)");
      star.addColorStop(1, "rgba(255, 220, 150, 0)");
      ctx.fillStyle = star;
      ctx.beginPath();
      ctx.arc(cx, cy, starR, 0, Math.PI * 2);
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
