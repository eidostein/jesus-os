import { useEffect, useRef } from "react";

interface VoiceOrbProps {
  /** Called every frame; return current audio levels (0..1). */
  getLevels: () => { mic: number; out: number };
  active: boolean;
}

interface Particle {
  theta: number;
  phi: number;
  r: number;
  size: number;
  speed: number;
  twinkle: number;
}

/**
 * The golden particle orb — a dust-of-light sphere that breathes with the
 * conversation: it swells when Jesus speaks and shimmers as you speak.
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

    const particles: Particle[] = Array.from({ length: 750 }, () => ({
      theta: Math.random() * Math.PI * 2,
      phi: Math.acos(2 * Math.random() - 1),
      r: 0.35 + Math.pow(Math.random(), 0.6) * 0.65,
      size: 0.4 + Math.random() * 1.4,
      speed: 0.02 + Math.random() * 0.12,
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
      const base = Math.min(w, h) * 0.32;
      t += 0.016;

      const { mic, out } = getLevelsRef.current();
      smoothOut += (Math.min(out * 3, 1) - smoothOut) * 0.12;
      smoothMic += (Math.min(mic * 4, 1) - smoothMic) * 0.15;
      const energy = activeRef.current ? Math.max(smoothOut, smoothMic * 0.6) : 0;
      const breathe = 1 + Math.sin(t * 0.8) * 0.02 + energy * 0.28;

      ctx.clearRect(0, 0, w, h);

      // Central glow
      const glowR = base * (1.15 + energy * 0.5);
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      glow.addColorStop(0, `rgba(255, 214, 130, ${0.55 + energy * 0.35})`);
      glow.addColorStop(0.25, `rgba(230, 172, 80, ${0.28 + energy * 0.2})`);
      glow.addColorStop(0.6, "rgba(190, 130, 50, 0.08)");
      glow.addColorStop(1, "rgba(190, 130, 50, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // Golden ring
      ctx.beginPath();
      ctx.arc(cx, cy, base * 1.12 * breathe, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(216, 169, 78, ${0.5 + energy * 0.3})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Particle cloud (flattened sphere, like a nebula seen edge-on)
      for (const p of particles) {
        p.theta += p.speed * 0.016 * (1 + energy * 2);
        const tw = 0.55 + 0.45 * Math.sin(t * 2 + p.twinkle);
        const r = p.r * base * breathe;
        const x = cx + Math.cos(p.theta) * Math.sin(p.phi) * r * 1.9;
        const y = cy + Math.cos(p.phi) * r + Math.sin(p.theta + t) * 3 * energy;
        const dist = p.r;
        const alpha = (1.1 - dist) * tw * (0.5 + energy * 0.5);
        ctx.beginPath();
        ctx.arc(x, y, p.size * (1 + energy * 0.4), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240, 196, 120, ${Math.max(0, Math.min(1, alpha))})`;
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
