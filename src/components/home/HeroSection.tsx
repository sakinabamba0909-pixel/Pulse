'use client';

import { useState, useRef, useEffect } from 'react';
import Orb from '@/components/Orb';

/* ─── Palette ─── */
const P = {
  ink:      '#2D2026',
  inkSoft:  '#6B5860',
  inkMuted: '#A8949C',
  inkFaint: '#D4C8CD',
  orchid:   '#D56989',
  green:    '#C2DC80',
  pink:     '#EA9CAF',
  divider:  'rgba(45,32,38,0.05)',
};

/* ─── TypeWriter ─── */
function TypeWriter({ text, speed = 20 }: { text: string; speed?: number }) {
  const [shown, setShown] = useState('');
  const idx = useRef(0);

  useEffect(() => {
    idx.current = 0;
    setShown('');
    const iv = setInterval(() => {
      if (idx.current < text.length) {
        setShown(text.slice(0, idx.current + 1));
        idx.current++;
      } else {
        clearInterval(iv);
      }
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed]);

  return (
    <span>
      {shown}
      <span style={{ opacity: shown.length < text.length ? 1 : 0, color: P.orchid, transition: 'opacity 0.3s' }}>|</span>
    </span>
  );
}

/* ─── Component ─── */
interface HeroSectionProps {
  greeting: string;
  name: string;
  dateStr: string;
  timeStr: string;
  urgentCount: number;
  pulseMessages: string[];
}

export default function HeroSection({ greeting, name, dateStr, timeStr, urgentCount, pulseMessages }: HeroSectionProps) {
  const [msgIdx, setMsgIdx] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const msgs = pulseMessages.length > 0 ? pulseMessages : [
    'Your schedule looks manageable today.',
  ];

  const urgentText = urgentCount > 0
    ? <><a href="/app/tasks?filter=urgent" style={{ color: P.ink, fontWeight: 500, textDecoration: 'none', borderBottom: `1px solid ${P.inkFaint}`, transition: 'border-color 0.2s' }}>{urgentCount} urgent thing{urgentCount !== 1 ? 's' : ''}</a> and a clear afternoon.</>
    : <>Nothing urgent — enjoy your day.</>;

  return (
    <div style={{ marginBottom: 48, animation: 'fadeUp 0.7s ease both' }}>
      {/* Large editorial greeting */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, color: P.inkMuted, letterSpacing: 0.6, fontWeight: 300, marginBottom: 14 }}>
            {dateStr} &nbsp;·&nbsp; {timeStr}
          </p>
          <h1 style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 54, fontWeight: 200, letterSpacing: -2,
            color: P.ink, lineHeight: 0.95, marginBottom: 0,
          }}>
            {greeting},
          </h1>
          <h1 style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 54, fontWeight: 200, letterSpacing: -2,
            color: P.orchid, lineHeight: 0.95, fontStyle: 'italic', marginBottom: 18,
          }}>
            {name}.
          </h1>
          <p style={{ fontSize: 15, color: P.inkMuted, fontWeight: 300 }}>
            You have {urgentText}
          </p>
        </div>
        {/* Orb cluster right side */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, paddingTop: 4 }}>
          <Orb size={72} float />
          <div style={{ display: 'flex', gap: 5 }}>
            {[P.green, P.pink, P.orchid, '#D4A47A'].map((c, i) => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: c, opacity: 0.55 }} />
            ))}
          </div>
        </div>
      </div>

      {/* Pulse insight — inline, not a box */}
      {!dismissed && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: '16px 0',
          borderTop: `1px solid ${P.divider}`,
          borderBottom: `1px solid ${P.divider}`,
        }}>
          <Orb size={18} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: P.orchid, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>
              Pulse
            </p>
            <p style={{ fontSize: 14, color: P.inkSoft, lineHeight: 1.55, fontWeight: 300 }}>
              <TypeWriter key={msgIdx} text={msgs[msgIdx % msgs.length]} speed={16} />
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginTop: 2 }}>
            <button onClick={() => setMsgIdx(i => i + 1)} style={{ fontSize: 11, color: P.orchid, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', fontWeight: 500 }}>
              next ›
            </button>
            <button onClick={() => setDismissed(true)} style={{ fontSize: 16, color: P.inkFaint, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
