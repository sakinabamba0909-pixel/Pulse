'use client';

import { useState } from 'react';

const P = {
  ink:          '#2D2026',
  inkMuted:     '#A8949C',
  inkFaint:     '#D4C8CD',
  orchid:       '#D56989',
  orchidSoft:   'rgba(213,105,137,0.12)',
  orchidBorder: 'rgba(213,105,137,0.25)',
  pink:         '#EA9CAF',
  pinkDark:     '#B85A74',
  green:        '#C2DC80',
  greenDark:    '#7A9E35',
  divider:      'rgba(45,32,38,0.05)',
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

  return (
    <div style={{ marginBottom: 48, animation: 'fadeUp 0.6s ease 0.12s both' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
        <p style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 13, fontWeight: 300, color: P.inkMuted,
          letterSpacing: 0.3, textTransform: 'uppercase',
        }}>
          Focus
        </p>
        <p style={{ fontSize: 11, color: P.inkMuted, fontWeight: 300 }}>
          {remaining} remaining
        </p>
      </div>

      {tasks.map((t, i) => {
        const d = !!done[t.id];
        const barColor = t.projectColor || (t.priority === 'urgent' ? P.pink : t.priority === 'high' ? '#D4A47A' : P.orchid);

        return (
          <div
            key={t.id}
            onClick={() => toggle(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 0,
              borderBottom: `1px solid ${P.divider}`,
              cursor: 'pointer', transition: 'all 0.22s',
              opacity: d ? 0.38 : 1,
              animation: `fadeUp 0.5s ease ${0.14 + i * 0.07}s both`,
            }}
          >
            {/* colored left accent bar */}
            <div style={{
              width: 3, height: 60, background: d ? P.inkFaint : barColor,
              borderRadius: 2, flexShrink: 0, marginRight: 18,
              opacity: d ? 0.3 : 1, transition: 'all 0.2s',
            }} />

            {/* check */}
            <div style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginRight: 14,
              border: `1.5px solid ${d ? P.inkFaint : barColor}`,
              background: d ? barColor : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}>
              {d && <span style={{ color: 'white', fontSize: 9, fontWeight: 700 }}>✓</span>}
            </div>

            {/* text */}
            <div style={{ flex: 1, minWidth: 0, padding: '16px 0' }}>
              <p style={{
                fontSize: 16, fontWeight: d ? 300 : 500,
                color: d ? P.inkMuted : P.ink,
                textDecoration: d ? 'line-through' : 'none',
                letterSpacing: -0.2, marginBottom: 3,
              }}>
                {t.title}
              </p>
              <p style={{ fontSize: 11, color: P.inkMuted, fontWeight: 300 }}>
                {t.projectName}
              </p>
            </div>

            {/* urgent tag */}
            {t.priority === 'urgent' && !d && (
              <div style={{
                padding: '3px 10px', borderRadius: 20,
                background: P.orchidSoft, border: `1px solid ${P.orchidBorder}`,
                flexShrink: 0, marginLeft: 12,
              }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: P.orchid, letterSpacing: 0.5 }}>
                  URGENT
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
