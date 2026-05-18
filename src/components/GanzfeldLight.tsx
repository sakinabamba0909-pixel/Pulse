'use client';

import { useEffect, useRef } from 'react';

interface GanzfeldLightProps {
  mood: string;
  scrollY: number;
  bloom: number;
  isIntro?: boolean;
}

export default function GanzfeldLight({ mood, scrollY, bloom, isIntro = false }: GanzfeldLightProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const phase = useRef(0);
  const frame = useRef<number>(0);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    function resize() {
      c!.width = window.innerWidth;
      c!.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function hsl(h: number, s: number, l: number, a: number) {
      return `hsla(${h},${s}%,${l}%,${a})`;
    }

    function draw() {
      phase.current += 0.0012;
      const t = phase.current;
      const d = Math.sin(t) * 5;
      const d2 = Math.cos(t * 0.7) * 4;
      const W = c!.width;
      const H = c!.height;
      ctx!.clearRect(0, 0, W, H);

      // Base warm background
      ctx!.fillStyle = '#F2EBE6';
      ctx!.fillRect(0, 0, W, H);

      // Gradient layers — pink top-left, green top-right, rose bottom, orchid center
      const layers: [number, number, number, number, number, number, number, number][] = [
        [W * 0.12, H * 0.08, W * 0.65, 330 + d,  60, 88, 0.30, 0.08],
        [W * 0.80, H * 0.18, W * 0.55, 80 + d2,  50, 85, 0.22, 0.06],
        [W * 0.50, H * 0.92, W * 0.60, 350 - d,  55, 87, 0.20, 0.05],
        [W * 0.55, H * 0.50, W * 0.30, 300 + d2, 45, 86, 0.14, 0.00],
      ];

      layers.forEach(([cx, cy, r, h, s, l, a1, a2]) => {
        const g = ctx!.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, hsl(h, s, l, a1));
        g.addColorStop(0.5, hsl(h, s, l, a2));
        g.addColorStop(1, 'transparent');
        ctx!.fillStyle = g;
        ctx!.fillRect(0, 0, W, H);
      });

      frame.current = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(frame.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
