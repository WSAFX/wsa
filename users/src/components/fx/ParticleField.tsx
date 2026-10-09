import { useEffect, useRef } from 'react';

interface Props {
  className?: string;
  /** particles per 10,000 px² of area */
  density?: number;
  /** max distance (px) at which two particles are linked */
  linkDistance?: number;
  /** pull particles towards the pointer and draw links to it */
  interactive?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  gold: boolean;
}

const BLUE = '96, 165, 250';
const GOLD = '234, 179, 8';

/**
 * Animated "market network": drifting particles linked by lines, reacting to the pointer.
 * Canvas-based and self-throttling: pauses off-screen and in background tabs, caps DPR,
 * scales particle count with area, and renders a single static frame for reduced-motion users.
 */
const ParticleField = ({ className = '', density = 0.9, linkDistance = 130, interactive = true }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !parent || !ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let frame = 0;
    let running = false;
    let visible = true;
    const pointer = { x: -9999, y: -9999, active: false };

    const seed = () => {
      const count = Math.max(24, Math.min(120, Math.round(((width * height) / 10000) * density)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        r: Math.random() * 1.8 + 0.8,
        gold: Math.random() < 0.12,
      }));
    };

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      if (reduced) draw();
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const maxD2 = linkDistance * linkDistance;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!reduced) {
          // gentle pull towards the pointer
          if (interactive && pointer.active) {
            const dx = pointer.x - p.x;
            const dy = pointer.y - p.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < 40000 && d2 > 1) {
              p.vx += (dx / Math.sqrt(d2)) * 0.012;
              p.vy += (dy / Math.sqrt(d2)) * 0.012;
            }
          }
          p.vx *= 0.995;
          p.vy *= 0.995;
          // keep a minimum drift so the field never freezes
          if (Math.abs(p.vx) < 0.05) p.vx += (Math.random() - 0.5) * 0.04;
          if (Math.abs(p.vy) < 0.05) p.vy += (Math.random() - 0.5) * 0.04;
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
          if (p.y < -10) p.y = height + 10;
          if (p.y > height + 10) p.y = -10;
        }

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < maxD2) {
            const a = (1 - d2 / maxD2) * 0.35;
            ctx.strokeStyle = `rgba(${p.gold && q.gold ? GOLD : BLUE}, ${a})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }

        if (interactive && pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < maxD2 * 1.4) {
            ctx.strokeStyle = `rgba(${GOLD}, ${(1 - d2 / (maxD2 * 1.4)) * 0.5})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.stroke();
          }
        }

        ctx.fillStyle = `rgba(${p.gold ? GOLD : BLUE}, ${p.gold ? 0.9 : 0.75})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = () => {
      draw();
      frame = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running || reduced || !visible || document.hidden) return;
      running = true;
      frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = pointer.x >= 0 && pointer.y >= 0 && pointer.x <= width && pointer.y <= height;
    };
    const onLeave = () => (pointer.active = false);
    const onVisibility = () => (document.hidden ? stop() : start());

    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(canvas);
    if (interactive) {
      parent.addEventListener('pointermove', onMove);
      parent.addEventListener('pointerleave', onLeave);
    }
    document.addEventListener('visibilitychange', onVisibility);
    resize();
    start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      parent.removeEventListener('pointermove', onMove);
      parent.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [density, linkDistance, interactive]);

  return <canvas ref={canvasRef} aria-hidden="true" className={`pointer-events-none absolute inset-0 ${className}`} />;
};

export default ParticleField;
