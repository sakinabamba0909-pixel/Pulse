'use client';

import { useEffect, useRef } from 'react';

interface OrbProps {
  size?: number;
  animate?: boolean;
  dark?: boolean;
}

export default function Orb({ size = 120, animate = true, dark = false }: OrbProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const phase = useRef(0);

  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d')!;
    cvs.width = size * 2;
    cvs.height = size * 2;
    ctx.scale(2, 2);
    const cx = size / 2, cy = size / 2;

    const draw = () => {
      phase.current += animate ? 0.015 : 0;
      const t = phase.current;
      ctx.clearRect(0, 0, size, size);

      // Outer glow
      const g1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.45);
      g1.addColorStop(0, dark ? 'rgba(110,231,160,0.1)' : 'rgba(45,184,122,0.08)');
      g1.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g1;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // Rings
      for (let i = 0; i < 3; i++) {
        const r = size * 0.15 + i * size * 0.07 + Math.sin(t + i * 0.8) * 2;
        ctx.strokeStyle = dark
          ? `rgba(110,231,160,${0.15 - i * 0.04})`
          : `rgba(45,184,122,${0.12 - i * 0.03})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Core
      const cr = size * 0.1 + Math.sin(t * 2) * 1.5;
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
      cg.addColorStop(0, dark ? '#6EE7A0' : '#2DB87A');
      cg.addColorStop(1, dark ? '#3BA872' : '#22966A');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fill();

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [size, animate, dark]);

  return <canvas ref={ref} style={{ width: size, height: size }} />;
}
