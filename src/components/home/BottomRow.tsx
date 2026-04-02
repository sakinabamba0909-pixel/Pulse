'use client';

const P = {
  ink:      '#2D2026',
  inkMuted: '#A8949C',
  orchid:   '#D56989',
  green:    '#C2DC80',
  pink:     '#EA9CAF',
  divider:  'rgba(45,32,38,0.05)',
};

interface RhythmItem {
  icon: string;
  time: string;
  label: string;
}

interface StatItem {
  val: string;
  label: string;
  color: string;
}

interface BottomRowProps {
  rhythm: RhythmItem[];
  stats: StatItem[];
}

export default function BottomRow({ rhythm, stats }: BottomRowProps) {
  return (
    <div style={{
      display: 'flex', gap: 0, alignItems: 'stretch',
      borderTop: `1px solid ${P.divider}`, paddingTop: 28,
      animation: 'fadeUp 0.6s ease 0.30s both',
    }}>
      {/* Rhythm — left */}
      <div style={{ flex: 1, paddingRight: 32 }}>
        <p style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 11, fontWeight: 300, color: P.inkMuted,
          letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 14,
        }}>
          Rhythm
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rhythm.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, width: 16, textAlign: 'center', flexShrink: 0 }}>{r.icon}</span>
              <p style={{ fontSize: 12, fontWeight: 500, color: P.ink, width: 60 }}>{r.time}</p>
              <p style={{ fontSize: 11, color: P.inkMuted, fontWeight: 300 }}>{r.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Vertical divider */}
      <div style={{ width: 1, background: P.divider }} />

      {/* Stats — right, big numbers */}
      <div style={{ flex: 1, paddingLeft: 32, display: 'flex', gap: 0, justifyContent: 'space-around', alignItems: 'center' }}>
        {stats.map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <p style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 40, fontWeight: 200, color: s.color,
              lineHeight: 1, letterSpacing: -1, marginBottom: 4,
            }}>
              {s.val}
            </p>
            <p style={{
              fontSize: 10, color: P.inkMuted, fontWeight: 300,
              letterSpacing: 0.3, textTransform: 'uppercase',
            }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
