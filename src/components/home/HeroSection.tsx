'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Orb from '@/components/Orb';

/* ─── Palette (matches globals.css vars) ─── */
const P = {
  ink:          '#2D2026',
  inkSoft:      '#6B5860',
  inkMuted:     '#A8949C',
  inkFaint:     '#D4C8CD',
  orchid:       '#D56989',
  orchidSoft:   'rgba(213,105,137,0.12)',
  orchidBorder: 'rgba(213,105,137,0.25)',
  green:        '#C2DC80',
  greenDark:    '#7A9E35',
  greenSoft:    'rgba(194,220,128,0.18)',
  greenBorder:  'rgba(194,220,128,0.35)',
  pink:         '#EA9CAF',
  pinkSoft:     'rgba(234,156,175,0.15)',
  pinkBorder:   'rgba(234,156,175,0.30)',
  divider:      'rgba(45,32,38,0.05)',
  border:       'rgba(45,32,38,0.07)',
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
  briefingSummary?: string; // text summary for speak/write
  briefingFormat?: string;  // 'alarm' | 'written' | 'both'
}

export default function HeroSection({ greeting, name, dateStr, timeStr, urgentCount, pulseMessages, briefingSummary, briefingFormat }: HeroSectionProps) {
  const [msgIdx, setMsgIdx] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [showWritten, setShowWritten] = useState(false);

  const speakBriefing = useCallback(() => {
    if (!briefingSummary || typeof window === 'undefined') return;
    if (speaking) {
      window.speechSynthesis?.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(briefingSummary);
    utterance.rate = 1.05;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis?.speak(utterance);
    setSpeaking(true);
  }, [briefingSummary, speaking]);

  const msgs = pulseMessages.length > 0 ? pulseMessages : [
    'Your schedule looks manageable today.',
  ];

  const urgentText = urgentCount > 0
    ? <><span style={{ color: P.ink, fontWeight: 500 }}>{urgentCount} urgent thing{urgentCount !== 1 ? 's' : ''}</span> and a clear afternoon.</>
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
            {msgs.length > 1 && (
              <button
                onClick={() => setMsgIdx(i => i + 1)}
                style={{ fontSize: 11, color: P.orchid, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', fontWeight: 500 }}
              >
                next ›
              </button>
            )}
            <button
              onClick={() => setDismissed(true)}
              style={{ fontSize: 16, color: P.inkFaint, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Briefing action buttons */}
      {briefingSummary && (
        <div style={{ display: 'flex', gap: 10, marginTop: dismissed ? 0 : 16 }}>
          <button
            onClick={speakBriefing}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 14,
              background: speaking ? P.orchidSoft : P.pinkSoft,
              border: `1px solid ${speaking ? P.orchidBorder : P.pinkBorder}`,
              cursor: 'pointer', transition: 'all 0.2s',
              fontSize: 13, fontWeight: 500, color: speaking ? P.orchid : P.ink,
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            <span style={{ fontSize: 15 }}>{speaking ? '⏸' : '🔔'}</span>
            {speaking ? 'Stop' : 'Speak it'}
          </button>
          <button
            onClick={() => setShowWritten(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 14,
              background: showWritten ? P.greenSoft : 'rgba(255,255,255,0.5)',
              border: `1px solid ${showWritten ? P.greenBorder : P.border}`,
              cursor: 'pointer', transition: 'all 0.2s',
              fontSize: 13, fontWeight: 500, color: showWritten ? P.greenDark : P.ink,
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            <span style={{ fontSize: 15 }}>📖</span>
            Write it out
          </button>
        </div>
      )}

      {/* Written briefing panel */}
      {showWritten && briefingSummary && (
        <div style={{
          marginTop: 14, padding: '16px 20px', borderRadius: 16,
          background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)',
          border: `1px solid ${P.border}`,
          animation: 'fadeUp 0.3s ease both',
        }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: P.green, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
            Your Briefing
          </p>
          <p style={{ fontSize: 14, color: P.inkSoft, lineHeight: 1.7, fontWeight: 300 }}>
            {briefingSummary}
          </p>
        </div>
      )}
    </div>
  );
}
