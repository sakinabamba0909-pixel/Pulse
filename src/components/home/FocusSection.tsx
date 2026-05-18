'use client';

import { useState } from 'react';

const P = {
  ink:          '#2D2026',
  inkSoft:      '#5C4A52',
  inkMuted:     '#887078',
  inkFaint:     '#B3A5AB',
  orchid:       '#D56989',
  orchidSoft:   'rgba(213,105,137,0.10)',
  orchidBorder: 'rgba(213,105,137,0.20)',
  pink:         '#EA9CAF',
  pinkDark:     '#B85A74',
  green:        '#C2DC80',
  greenDark:    '#7A9E35',
  greenSoft:    'rgba(194,220,128,0.14)',
  greenBorder:  'rgba(194,220,128,0.30)',
  surface:      'rgba(255,255,255,0.55)',
  divider:      'rgba(45,32,38,0.05)',
};

const PRIORITY_ACCENT: Record<string, { bg: string; border: string; dot: string; label: string }> = {
  urgent: { bg: 'rgba(213,105,137,0.08)', border: 'rgba(213,105,137,0.18)', dot: P.pink, label: 'URGENT' },
  high:   { bg: 'rgba(212,164,122,0.08)', border: 'rgba(212,164,122,0.20)', dot: '#D4A47A', label: 'HIGH' },
  normal: { bg: 'transparent', border: 'transparent', dot: P.orchid, label: '' },
  low:    { bg: 'transparent', border: 'transparent', dot: P.inkFaint, label: '' },
};

export interface FocusTask {
  id: string;
  title: string;
  priority: string;
  due_at?: string;
  projectName?: string;
  projectColor?: string;
  isPinned?: boolean;
}

interface FocusSectionProps {
  tasks: FocusTask[];
}

export default function FocusSection({ tasks }: FocusSectionProps) {
  const [done, setDone] = useState<Record<string, boolean>>({});

  function toggle(id: string) {
    setDone(prev => ({ ...prev, [id]: !prev[id] }));
    if (!done[id]) {
      fetch(`/api/tasks/${id}/complete`, { method: 'POST' }).catch(() => {});
    }
  }

  if (tasks.length === 0) return null;

  const remaining = tasks.filter(t => !done[t.id]).length;
  const total = tasks.length;

  return (
    <div style={{ marginBottom: 48, animation: 'fadeUp 0.6s ease 0.12s both' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
        <p style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 13, fontWeight: 300, color: P.inkMuted,
          letterSpacing: 0.3, textTransform: 'uppercase',
        }}>
          Focus
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 48, height: 3, borderRadius: 2, background: P.divider, overflow: 'hidden',
          }}>
            <div style={{
              width: `${total > 0 ? ((total - remaining) / total) * 100 : 0}%`,
              height: '100%', borderRadius: 2,
              background: `linear-gradient(90deg, ${P.green}, ${P.orchid})`,
              transition: 'width 0.4s ease',
            }} />
          </div>
          <p style={{ fontSize: 11, color: P.inkMuted, fontWeight: 400 }}>
            {total - remaining}/{total}
          </p>
        </div>
      </div>

      {/* Task cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tasks.map((t, i) => {
          const d = !!done[t.id];
          const accent = PRIORITY_ACCENT[t.priority] || PRIORITY_ACCENT.normal;
          const barColor = t.projectColor || accent.dot;

          return (
            <div
              key={t.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px',
                background: d ? 'rgba(194,220,128,0.06)' : P.surface,
                borderRadius: 14,
                border: `1px solid ${d ? P.greenBorder : 'rgba(45,32,38,0.06)'}`,
                backdropFilter: 'blur(12px)',
                transition: 'all 0.25s ease',
                opacity: d ? 0.55 : 1,
                animation: `fadeUp 0.5s ease ${0.14 + i * 0.06}s both`,
              }}
            >
              {/* Left accent bar */}
              <div style={{
                width: 3, alignSelf: 'stretch', minHeight: 32,
                background: d ? P.green : barColor,
                borderRadius: 2, flexShrink: 0,
                opacity: d ? 0.4 : 0.8, transition: 'all 0.2s',
              }} />

              {/* Check circle */}
              <div
                onClick={(e) => { e.stopPropagation(); toggle(t.id); }}
                style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  border: d ? 'none' : `1.5px solid ${barColor}40`,
                  background: d
                    ? `linear-gradient(135deg, ${P.green}, ${P.greenDark})`
                    : `${barColor}08`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', cursor: 'pointer',
                  boxShadow: d ? `0 2px 8px ${P.green}40` : 'none',
                }}
              >
                {d && <span style={{ color: 'white', fontSize: 10, fontWeight: 700 }}>✓</span>}
              </div>

              {/* Text content */}
              <a href={`/app/tasks?task=${t.id}`} style={{
                flex: 1, minWidth: 0, textDecoration: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', gap: 2,
              }}>
                <p style={{
                  fontSize: 14, fontWeight: d ? 400 : 500,
                  color: d ? P.inkMuted : P.ink,
                  textDecoration: d ? 'line-through' : 'none',
                  letterSpacing: -0.15,
                  lineHeight: 1.35,
                }}>
                  {t.title}
                </p>
                {t.projectName && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: t.projectColor || P.orchid, opacity: 0.7,
                    }} />
                    <p style={{ fontSize: 11, color: P.inkMuted, fontWeight: 400 }}>
                      {t.projectName}
                    </p>
                  </div>
                )}
              </a>

              {/* Priority / pin badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                {t.isPinned && !d && (
                  <span style={{ fontSize: 12, opacity: 0.5 }}>📌</span>
                )}
                {accent.label && !d && (
                  <div style={{
                    padding: '3px 9px', borderRadius: 20,
                    background: accent.bg,
                    border: `1px solid ${accent.border}`,
                  }}>
                    <p style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
                      color: accent.dot,
                    }}>
                      {accent.label}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
