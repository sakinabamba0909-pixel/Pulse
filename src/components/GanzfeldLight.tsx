'use client';

import { useEffect, useRef } from 'react';

interface GanzfeldLightProps {
  mood: string;
  scrollY: number;
  bloom: number;
  isIntro?: boolean;
}

// Cool blue → lavender → pink palette inspired by the Rythm reference
const MOODS: Record<string, { a: number[]; b: number[]; c: number[]; d: number[] }> = {
  intro:     { a: [220, 50, 80], b: [270, 42, 82], c: [320, 45, 82], d: [240, 38, 84] },
  home:      { a: [215, 45, 81], b: [265, 38, 83], c: [325, 40, 82], d: [245, 35, 85] },
  tasks:     { a: [225, 42, 80], b: [275, 40, 82], c: [315, 42, 83], d: [250, 36, 84] },
  goals:     { a: [210, 48, 80], b: [250, 42, 82], c: [290, 38, 84], d: [230, 40, 83] },
  people:    { a: [230, 40, 82], b: [290, 42, 81], c: [330, 44, 82], d: [260, 36, 84] },
  reminders: { a: [210, 44, 82], b: [255, 40, 83], c: [300, 38, 83], d: [235, 38, 85] },
  projects:  { a: [220, 42, 81], b: [270, 40, 82], c: [310, 40, 83], d: [245, 36, 84] },
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
      const drift = Math.sin(t) * 5;
      const bloomBoostS = bloomRef.current * 14;
      const bloomBoostL = bloomRef.current * 4;

      // Lerp toward target
      for (let i = 0; i < 3; i++) {
        cur.a[i] = lerp(cur.a[i], target.a[i] + (i === 1 ? bloomBoostS : i === 2 ? bloomBoostL : 0), speed);
        cur.b[i] = lerp(cur.b[i], target.b[i] + (i === 1 ? bloomBoostS : i === 2 ? bloomBoostL : 0), speed);
        cur.c[i] = lerp(cur.c[i], target.c[i], speed);
        cur.d[i] = lerp(cur.d[i], target.d[i], speed);
      }

      const hslA = `hsl(${cur.a[0] + drift},${cur.a[1]}%,${cur.a[2]}%)`;
      const hslB = `hsl(${cur.b[0] - drift * 0.5},${cur.b[1]}%,${cur.b[2]}%)`;
      const hslC = `hsl(${cur.c[0] + drift * 0.3},${cur.c[1]}%,${cur.c[2]}%)`;
      const hslD = `hsl(${cur.d[0]},${cur.d[1]}%,${cur.d[2]}%)`;

      const scrollShift = scrollRef.current * 0.015;
      const scale = isIntroRef.current ? 'scale(1.15)' : 'scale(1)';

      if (layer1Ref.current) {
        layer1Ref.current.style.background = `radial-gradient(ellipse 130% 110% at ${15 + scrollShift * 0.3}% ${10 - scrollShift}%, ${hslA} 0%, transparent 65%)`;
        layer1Ref.current.style.opacity = '0.55';
        layer1Ref.current.style.transform = scale;
      }
      if (layer2Ref.current) {
        layer2Ref.current.style.background = `radial-gradient(ellipse 110% 130% at ${80 - scrollShift * 0.2}% ${20 - scrollShift * 0.5}%, ${hslB} 0%, transparent 65%)`;
        layer2Ref.current.style.opacity = '0.50';
        layer2Ref.current.style.transform = scale;
      }
      if (layer3Ref.current) {
        layer3Ref.current.style.background = `radial-gradient(ellipse 140% 90% at ${55 + scrollShift * 0.1}% ${90 + scrollShift * 0.3}%, ${hslC} 0%, transparent 60%)`;
        layer3Ref.current.style.opacity = '0.50';
        layer3Ref.current.style.transform = scale;
      }
      if (layer4Ref.current) {
        layer4Ref.current.style.background = `radial-gradient(ellipse 70% 60% at ${50 - scrollShift * 0.1}% ${40 - scrollShift * 0.4}%, ${hslD} 0%, transparent 65%)`;
        layer4Ref.current.style.opacity = '0.30';
        layer4Ref.current.style.transform = scale;
      }
      if (layer5Ref.current) {
        layer5Ref.current.style.background = `linear-gradient(170deg, ${hslA} 0%, ${hslC} 100%)`;
        layer5Ref.current.style.opacity = '0.30';
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
      background: '#C5CDDA',
    }}>
      <div ref={layer1Ref} style={baseLayer} />
      <div ref={layer2Ref} style={baseLayer} />
      <div ref={layer3Ref} style={baseLayer} />
      <div ref={layer4Ref} style={baseLayer} />
      <div ref={layer5Ref} style={{ ...baseLayer, inset: '-20%' }} />
    </div>
  );
}
