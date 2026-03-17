'use client';

import { useEffect, useRef } from 'react';

interface GanzfeldLightProps {
  mood: string;
  scrollY: number;
  bloom: number;
  isIntro?: boolean;
}

const MOODS: Record<string, { a: number[]; b: number[]; c: number[]; d: number[] }> = {
  intro:     { a: [285, 55, 90], b: [335, 50, 88], c: [10,  45, 92], d: [260, 40, 94] },
  home:      { a: [280, 45, 91], b: [330, 40, 89], c: [20,  35, 93], d: [250, 35, 94] },
  tasks:     { a: [275, 40, 91], b: [320, 42, 89], c: [350, 35, 92], d: [240, 30, 94] },
  goals:     { a: [220, 45, 91], b: [260, 40, 89], c: [200, 35, 93], d: [280, 30, 94] },
  people:    { a: [330, 45, 90], b: [10,  45, 89], c: [340, 35, 92], d: [300, 30, 94] },
  reminders: { a: [200, 40, 91], b: [240, 40, 89], c: [180, 30, 93], d: [220, 25, 94] },
  projects:  { a: [30,  40, 91], b: [280, 35, 90], c: [50,  35, 93], d: [10,  30, 94] },
};

export default function GanzfeldLight({ mood, scrollY, bloom, isIntro = false }: GanzfeldLightProps) {
  const layer1Ref = useRef<HTMLDivElement>(null);
  const layer2Ref = useRef<HTMLDivElement>(null);
  const layer3Ref = useRef<HTMLDivElement>(null);
  const layer4Ref = useRef<HTMLDivElement>(null);
  const layer5Ref = useRef<HTMLDivElement>(null);

  const currentColors = useRef({ a: [...(MOODS.home.a)], b: [...(MOODS.home.b)], c: [...(MOODS.home.c)], d: [...(MOODS.home.d)] });
  const animRef = useRef<number>(0);
  const tRef = useRef(0);
  const moodRef = useRef(mood);
  const bloomRef = useRef(bloom);
  const scrollRef = useRef(scrollY);
  const isIntroRef = useRef(isIntro);

  useEffect(() => { moodRef.current = mood; }, [mood]);
  useEffect(() => { bloomRef.current = bloom; }, [bloom]);
  useEffect(() => { scrollRef.current = scrollY; }, [scrollY]);
  useEffect(() => { isIntroRef.current = isIntro; }, [isIntro]);

  useEffect(() => {
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const animate = () => {
      tRef.current += 0.016;
      const t = tRef.current;
      const target = MOODS[moodRef.current] || MOODS.home;
      const cur = currentColors.current;
      const speed = 0.006;
      const drift = Math.sin(t) * 4;
      const bloomBoostS = bloomRef.current * 12;
      const bloomBoostL = bloomRef.current * 3;

      // Lerp toward target
      for (let i = 0; i < 3; i++) {
        cur.a[i] = lerp(cur.a[i], target.a[i] + (i === 1 ? bloomBoostS : i === 2 ? bloomBoostL : 0), speed);
        cur.b[i] = lerp(cur.b[i], target.b[i] + (i === 1 ? bloomBoostS : i === 2 ? bloomBoostL : 0), speed);
        cur.c[i] = lerp(cur.c[i], target.c[i], speed);
        cur.d[i] = lerp(cur.d[i], target.d[i], speed);
      }

      const hslA = `hsl(${cur.a[0] + drift},${cur.a[1]}%,${cur.a[2]}%)`;
      const hslB = `hsl(${cur.b[0] - drift * 0.5},${cur.b[1]}%,${cur.b[2]}%)`;
      const hslC = `hsl(${cur.c[0]},${cur.c[1]}%,${cur.c[2]}%)`;
      const hslD = `hsl(${cur.d[0]},${cur.d[1]}%,${cur.d[2]}%)`;

      const scrollShift = scrollRef.current * 0.015;
      const scale = isIntroRef.current ? 'scale(1.15)' : 'scale(1)';

      if (layer1Ref.current) {
        layer1Ref.current.style.background = `radial-gradient(ellipse 120% 100% at ${15 + scrollShift * 0.3}% ${10 - scrollShift}%, ${hslA} 0%, transparent 70%)`;
        layer1Ref.current.style.opacity = '0.35';
        layer1Ref.current.style.transform = scale;
      }
      if (layer2Ref.current) {
        layer2Ref.current.style.background = `radial-gradient(ellipse 100% 120% at ${75 - scrollShift * 0.2}% ${25 - scrollShift * 0.5}%, ${hslB} 0%, transparent 70%)`;
        layer2Ref.current.style.opacity = '0.3';
        layer2Ref.current.style.transform = scale;
      }
      if (layer3Ref.current) {
        layer3Ref.current.style.background = `radial-gradient(ellipse 140% 80% at ${50 + scrollShift * 0.1}% ${95 + scrollShift * 0.3}%, ${hslC} 0%, transparent 70%)`;
        layer3Ref.current.style.opacity = '0.25';
        layer3Ref.current.style.transform = scale;
      }
      if (layer4Ref.current) {
        layer4Ref.current.style.background = `radial-gradient(ellipse 60% 50% at ${55 - scrollShift * 0.1}% ${35 - scrollShift * 0.4}%, ${hslD} 0%, transparent 70%)`;
        layer4Ref.current.style.opacity = '0.18';
        layer4Ref.current.style.transform = scale;
      }
      if (layer5Ref.current) {
        layer5Ref.current.style.background = `linear-gradient(180deg, ${hslA} 0%, transparent 60%)`;
        layer5Ref.current.style.opacity = '0.2';
        layer5Ref.current.style.transform = scale;
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const baseLayer: React.CSSProperties = {
    position: 'absolute',
    inset: '-30%',
    transition: 'transform 1.2s cubic-bezier(0.4,0,0.2,1)',
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 0,
      pointerEvents: 'none',
      overflow: 'hidden',
      background: '#F0EBE6',
    }}>
      <div ref={layer1Ref} style={baseLayer} />
      <div ref={layer2Ref} style={baseLayer} />
      <div ref={layer3Ref} style={baseLayer} />
      <div ref={layer4Ref} style={baseLayer} />
      <div ref={layer5Ref} style={{ ...baseLayer, inset: '-20%' }} />
    </div>
  );
}
