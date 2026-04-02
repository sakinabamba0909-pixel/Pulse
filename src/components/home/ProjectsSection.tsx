'use client';

import { useState } from 'react';

const P = {
  ink:      '#2D2026',
  inkMuted: '#A8949C',
  border:   'rgba(45,32,38,0.07)',
};

export interface ProjectData {
  id?: string;
  name: string;
  color: string;
  pct: number;
  step: string;
}

interface ProjectsSectionProps {
  projects: ProjectData[];
}

export default function ProjectsSection({ projects }: ProjectsSectionProps) {
  const [hov, setHov] = useState<number | null>(null);

  if (projects.length === 0) return null;

  return (
    <div style={{ marginBottom: 48, animation: 'fadeUp 0.6s ease 0.18s both' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
        <p style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 13, fontWeight: 300, color: P.inkMuted,
          letterSpacing: 0.3, textTransform: 'uppercase',
        }}>
          Projects
        </p>
        <p style={{ fontSize: 11, color: P.inkMuted, fontWeight: 300 }}>
          {projects.length} active
        </p>
      </div>

      {/* Wide horizontal cards — unequal widths based on progress */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
        {projects.map((p, i) => {
          const isHov = hov === i;
          const flexVal = 1;
          return (
            <a
              key={i}
              href={p.id ? `/app/projects?project=${p.id}` : '/app/projects'}
              onMouseEnter={() => setHov(i)}
              onMouseLeave={() => setHov(null)}
              style={{
                flex: flexVal, minWidth: 0, maxWidth: 220,
                borderRadius: 20,
                background: isHov ? `${p.color}22` : 'rgba(255,255,255,0.55)',
                backdropFilter: 'blur(16px)',
                border: `1px solid ${isHov ? `${p.color}50` : P.border}`,
                padding: '18px 16px 14px',
                cursor: 'pointer',
                transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
                position: 'relative',
                overflow: 'hidden',
                textDecoration: 'none', color: 'inherit',
              }}
            >
              {/* Color fill at bottom — progress indicator */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: `${p.pct}%`,
                background: `linear-gradient(0deg, ${p.color}18, transparent)`,
                borderRadius: '0 0 20px 20px',
                transition: 'height 0.6s ease',
              }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: 2,
                  background: p.color, marginBottom: 10,
                  boxShadow: `0 0 8px ${p.color}60`,
                }} />
                <p style={{
                  fontSize: 12, fontWeight: 500, color: P.ink, marginBottom: 4,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {p.name}
                </p>
                <p style={{
                  fontSize: 10, color: P.inkMuted, fontWeight: 300, marginBottom: 12,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {p.step}
                </p>
                <p style={{
                  fontSize: 18, fontWeight: 200, color: p.color,
                  fontFamily: "'Fraunces', serif", letterSpacing: -0.5,
                }}>
                  {p.pct}<span style={{ fontSize: 10 }}>%</span>
                </p>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
