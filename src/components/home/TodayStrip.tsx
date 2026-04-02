'use client';

/* ─── Palette ─── */
const P = {
  ink:      '#2D2026',
  inkMuted: '#A8949C',
  inkFaint: '#D4C8CD',
  green:    '#C2DC80',
  pink:     '#EA9CAF',
  orchid:   '#D56989',
  divider:  'rgba(45,32,38,0.05)',
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#D4727A',
  high:   '#D4A47A',
  normal: P.orchid,
  low:    P.inkFaint,
};

interface ScheduleEvent {
  time: string;
  label: string;
  color: string;
  isCurrent: boolean;
}

interface TodayStripProps {
  events: ScheduleEvent[];
  dateLabel: string; // e.g. "Tue Mar 18"
}

export default function TodayStrip({ events, dateLabel }: TodayStripProps) {
  if (events.length === 0) return null;

  return (
    <div style={{ marginBottom: 48, animation: 'fadeUp 0.6s ease 0.08s both' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
        <p style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 13, fontWeight: 300, color: P.inkMuted,
          letterSpacing: 0.3, textTransform: 'uppercase',
        }}>
          Today
        </p>
        <p style={{ fontSize: 11, color: P.inkMuted, fontWeight: 300 }}>{dateLabel}</p>
      </div>

      {/* Horizontal timeline bar */}
      <div style={{ position: 'relative', paddingBottom: 32 }}>
        {/* The track */}
        <div style={{ position: 'absolute', top: 22, left: 0, right: 0, height: 1.5, background: P.divider }} />

        {/* Events along the track */}
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
          {events.map((ev, i) => {
            const isLast = i === events.length - 1;
            return (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                flex: isLast ? 0 : 1, position: 'relative',
              }}>
                {/* dot on track */}
                <div style={{
                  width: ev.isCurrent ? 14 : 9,
                  height: ev.isCurrent ? 14 : 9,
                  borderRadius: '50%',
                  background: ev.isCurrent ? ev.color : P.inkFaint,
                  border: ev.isCurrent ? '2px solid white' : 'none',
                  boxShadow: ev.isCurrent
                    ? `0 0 12px ${ev.color}80, 0 0 0 3px ${ev.color}25`
                    : 'none',
                  marginBottom: 12,
                  transition: 'all 0.3s',
                  flexShrink: 0,
                }} />
                {/* label below */}
                <p style={{
                  fontSize: 10,
                  color: ev.isCurrent ? P.ink : P.inkMuted,
                  fontWeight: ev.isCurrent ? 600 : 300,
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  maxWidth: 80,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {ev.label}
                </p>
                <p style={{
                  fontSize: 10,
                  color: ev.isCurrent ? ev.color : P.inkFaint,
                  fontWeight: 300,
                  textAlign: 'center',
                }}>
                  {ev.time}
                </p>
                {ev.isCurrent && (
                  <p style={{
                    fontSize: 9, color: ev.color, fontWeight: 600,
                    letterSpacing: 0.3, marginTop: 2, textAlign: 'center',
                  }}>
                    now
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
