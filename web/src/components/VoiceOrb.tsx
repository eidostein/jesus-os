import { useEffect, useRef } from "react";
import faceMapUrl from "@/assets/face-map.jpg";

interface VoiceOrbProps {
  /** Called every frame; return current audio levels (0..1). */
  getLevels: () => { mic: number; out: number };
  active: boolean;
}

/* ── Look & feel ──────────────────────────────────────────────────────────────
   The orb draws the face of Jesus in golden dust: particle positions are
   sampled from the luminance of a contour drawing (assets/face-map.jpg), so
   swapping that image reshapes the whole graphic. Everything else — palette,
   density, glow, motion — is a dial below. Hand-drawn on canvas, no library.
   ────────────────────────────────────────────────────────────────────────── */
const FACE_PARTICLES = 5200; // dots forming the face (halved on small screens)
const DUST_COUNT = 460; // ambient sparkle drifting around the face
const SAMPLE_SIZE = 320; // resolution at which the map is sampled
const CONTRAST = 2.6; // higher = particles cling tighter to bright contours
const MIN_DOT_DIST = 1.75; // min spacing between dots in sample px — the "beads on
// a string" look: dots stay individually visible instead of clumping
// Palette from the mockup: champagne gold dust, warm amber glow.
const DUST_GOLD = "246, 208, 138";
const GLOW_WARM = "196, 142, 66";

interface FacePoint {
  u: number; // -1..1 across the face box
  v: number;
  l: number; // source luminance 0..1
  size: number;
  phase: number;
}

interface Dust {
  r: number;
  theta: number;
  size: number;
  speed: number;
  twinkle: number;
}

/**
 * The golden face orb — Jesus' face in particles of light. It glows and shimmers more strongly while he speaks and reacts
 * gently to the visitor's voice.
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

    let facePts: FacePoint[] = [];
    const img = new Image();
    img.src = faceMapUrl;
    img.onload = () => {
      const S = SAMPLE_SIZE;
      const oc = document.createElement("canvas");
      oc.width = S;
      oc.height = S;
      const octx = oc.getContext("2d", { willReadFrequently: true })!;
      octx.drawImage(img, 0, 0, S, S);
      const data = octx.getImageData(0, 0, S, S).data;

      // High-pass: luminance minus a blurred copy isolates the thin contour
      // lines (hair, eyes, beard) and cancels the broad soft glow — otherwise
      // the glow's sheer area soaks up all the particles and the face becomes
      // an unreadable blob. The warm glow is painted separately at draw time.
      const bc = document.createElement("canvas");
      bc.width = S;
      bc.height = S;
      const bctx = bc.getContext("2d", { willReadFrequently: true })!;
      bctx.filter = "blur(6px)";
      bctx.drawImage(img, 0, 0, S, S);
      const blur = bctx.getImageData(0, 0, S, S).data;
      const lumAt = (d: Uint8ClampedArray, i: number) =>
        (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;

      // Poisson-style spacing: a candidate is rejected when another accepted
      // dot sits within MIN_DOT_DIST, so lines render as strings of clearly
      // separate beads — the defining texture of the mockup.
      // cell = r/√2 guarantees at most one point per cell; neighbours within
      // two cells cover the full exclusion radius.
      const cell = MIN_DOT_DIST / Math.SQRT2;
      const gw = Math.ceil(S / cell);
      const grid: (FacePoint | undefined)[] = new Array(gw * gw);
      const farEnough = (px: number, py: number) => {
        const gx = (px / cell) | 0;
        const gy = (py / cell) | 0;
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const yy = gy + dy;
            const xx = gx + dx;
            if (xx < 0 || yy < 0 || xx >= gw || yy >= gw) continue;
            const n = grid[yy * gw + xx];
            if (!n) continue;
            const nx = ((n.u + 1) / 2) * S;
            const ny = ((n.v + 1) / 2) * S;
            if ((nx - px) ** 2 + (ny - py) ** 2 < MIN_DOT_DIST * MIN_DOT_DIST) return false;
          }
        }
        return true;
      };

      const pts: FacePoint[] = [];
      const target = small ? FACE_PARTICLES / 2 : FACE_PARTICLES;
      const sprinkle = Math.floor(target * 0.08); // soft fill inside the glow
      let guard = 0;
      while (pts.length < target && guard++ < 1_200_000) {
        const px = Math.random() * S;
        const py = Math.random() * S;
        const i = ((py | 0) * S + (px | 0)) * 4;
        const l = lumAt(data, i);
        const edge = Math.max(0, l - lumAt(blur, i));
        const wantSprinkle = pts.length < sprinkle;
        const p = wantSprinkle
          ? Math.pow(l, 3) * 0.5
          : Math.pow(Math.min(1, edge * 3.2), CONTRAST * 0.6);
        if (Math.random() < p && farEnough(px, py)) {
          const strength = wantSprinkle ? l * 0.5 : Math.min(1, 0.35 + edge * 2.6);
          const pt: FacePoint = {
            u: (px / S) * 2 - 1,
            v: (py / S) * 2 - 1,
            l: strength,
            size: 0.45 + Math.random() * 0.4 + strength * 0.3,
            phase: Math.random() * Math.PI * 2,
          };
          pts.push(pt);
          grid[((py / cell) | 0) * gw + ((px / cell) | 0)] = pt;
        }
      }
      facePts = pts;
    };

    const dust: Dust[] = Array.from({ length: small ? DUST_COUNT / 2 : DUST_COUNT }, () => ({
      r: 0.25 + Math.pow(Math.random(), 0.6) * 0.95,
      theta: Math.random() * Math.PI * 2,
      size: 0.4 + Math.random() * 1.5,
      speed: 0.03 + Math.random() * 0.08,
      twinkle: Math.random() * Math.PI * 2,
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
      const base = Math.min(w / 3.1, h / 2.85);
      t += 0.016;

      const { mic, out } = getLevelsRef.current();
      smoothOut += (Math.min(out * 3, 1) - smoothOut) * 0.12;
      smoothMic += (Math.min(mic * 4, 1) - smoothMic) * 0.15;
      const energy = activeRef.current ? Math.max(smoothOut, smoothMic * 0.6) : 0;
      // The face keeps its dignity: it breathes in brightness, not in shape.
      const pulse = 1 + Math.sin(t * 0.7) * 0.012 + energy * 0.035;

      ctx.clearRect(0, 0, w, h);

      // ── Warm glow behind the face ──────────────────────────────────────
      const glowR = base * (1.15 + energy * 0.35) * pulse;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      glow.addColorStop(0, `rgba(${GLOW_WARM}, ${0.5 + energy * 0.3})`);
      glow.addColorStop(0.45, `rgba(${GLOW_WARM}, ${0.2 + energy * 0.15})`);
      glow.addColorStop(1, `rgba(${GLOW_WARM}, 0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // ── Ambient dust drifting inside and around the circle ─────────────
      for (const p of dust) {
        p.theta += p.speed * 0.016 * (1 + energy * 1.5);
        const r = p.r * base * 1.38;
        const x = cx + Math.cos(p.theta) * r;
        const y = cy + Math.sin(p.theta) * r * 0.96;
        const tw = 0.5 + 0.5 * Math.sin(t * 1.6 + p.twinkle);
        const alpha = (1.15 - p.r) * tw * (0.35 + energy * 0.35);
        ctx.beginPath();
        ctx.arc(x, y, p.size * (1 + energy * 0.3), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${DUST_GOLD}, ${Math.max(0, Math.min(1, alpha))})`;
        ctx.fill();
      }

      // ── The face, in particles ─────────────────────────────────────────
      const F = base * 1.16 * pulse; // half-size of the face box
      const jitter = 1 + energy * 2.2;
      for (const p of facePts) {
        const x = cx + p.u * F + Math.sin(t * 0.9 + p.phase) * jitter;
        const y = cy + p.v * F + Math.cos(t * 0.8 + p.phase * 1.3) * jitter;
        const tw = 0.55 + 0.45 * Math.sin(t * 2.1 + p.phase);
        const alpha = (0.26 + p.l * 0.42) * tw * (0.72 + energy * 0.4);
        ctx.beginPath();
        ctx.arc(x, y, p.size * (1 + energy * 0.25), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${DUST_GOLD}, ${Math.max(0, Math.min(1, alpha))})`;
        ctx.fill();
      }

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
