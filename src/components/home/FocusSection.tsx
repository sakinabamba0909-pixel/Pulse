'use client';

import { useState, useMemo } from 'react';

const P = {
  ink:          '#2D2026',
  inkSoft:      '#6B5860',
  inkMuted:     '#A8949C',
  inkFaint:     '#D4C8CD',
  orchid:       '#D56989',
  orchidSoft:   'rgba(213,105,137,0.12)',
  orchidBorder: 'rgba(213,105,137,0.25)',
  pinkSoft:     'rgba(234,156,175,0.15)',
  pinkBorder:   'rgba(234,156,175,0.30)',
  pink:         '#EA9CAF',
  pinkDark:     '#B85A74',
  green:        '#C2DC80',
  greenSoft:    'rgba(194,220,128,0.18)',
  greenBorder:  'rgba(194,220,128,0.35)',
  greenDark:    '#7A9E35',
  divider:      'rgba(45,32,38,0.05)',
  border:       'rgba(45,32,38,0.07)',
};

/* ─── Helpers ─── */
function startOfDay(d: Date) { const n = new Date(d); n.setHours(0,0,0,0); return n; }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }

function dueBucket(due_at?: string): 'overdue' | 'today' | 'tomorrow' | 'week' | 'later' | 'someday' {
  if (!due_at) return 'someday';
  const d   = new Date(due_at);
  const now = startOfDay(new Date());
  const tom = addDays(now, 1);
  if (d < now)  return 'overdue';
  if (d < tom)  return 'today';
  if (d < addDays(tom, 1)) return 'tomorrow';
  if (d < addDays(now, 7)) return 'week';
  return 'later';
}

function formatDue(due_at?: string): string {
  if (!due_at) return '';
  const d = new Date(due_at);
  const now = startOfDay(new Date());
  const diff = Math.round((startOfDay(d).getTime() - now.getTime()) / 86400000);
  if (diff < 0)  return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 7)   return d.toLocaleDateString('en-US', { weekday: 'short' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDueTime(due_at?: string): string {
  if (!due_at) return '';
  const d = new Date(due_at);
  const h = d.getHours();
  const m = d.getMinutes();
  if (h === 0 && m === 0) return '';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

type Filter = 'all' | 'today' | 'tomorrow' | 'week' | 'urgent';

const BUCKET_LABELS: Record<string, string> = {
  overdue: 'Overdue',
  today: 'Today',
  tomorrow: 'Tomorrow',
  week: 'This Week',
  later: 'Later',
  someday: 'No Date',
};

const PRIORITY_TAG: Record<string, { label: string; bg: string; border: string; color: string }> = {
  urgent: { label: 'URGENT', bg: P.orchidSoft, border: P.orchidBorder, color: P.orchid },
  high:   { label: 'HIGH',   bg: 'rgba(212,164,122,0.10)', border: 'rgba(212,164,122,0.25)', color: '#D4A47A' },
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
  const [filter, setFilter] = useState<Filter>('all');

  function toggle(id: string) {
    setDone(prev => ({ ...prev, [id]: !prev[id] }));
    if (!done[id]) {
      fetch(`/api/tasks/${id}/complete`, { method: 'POST' }).catch(() => {});
    }
  }

  const filters: { key: Filter; label: string }[] = [
    { key: 'all',      label: 'All'       },
    { key: 'today',    label: 'Today'     },
    { key: 'tomorrow', label: 'Tomorrow'  },
    { key: 'week',     label: 'This Week' },
    { key: 'urgent',   label: 'Urgent'    },
  ];

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (done[t.id]) return true; // always show completed for undo
      if (filter === 'all') return true;
      if (filter === 'urgent') return t.priority === 'urgent';
      const bucket = dueBucket(t.due_at);
      if (filter === 'today') return bucket === 'today' || bucket === 'overdue';
      if (filter === 'tomorrow') return bucket === 'tomorrow';
      if (filter === 'week') return bucket === 'today' || bucket === 'overdue' || bucket === 'tomorrow' || bucket === 'week';
      return true;
    });
  }, [tasks, filter, done]);

  // Group by date bucket
  const grouped = useMemo(() => {
    const groups: Record<string, FocusTask[]> = {};
    const order = ['overdue', 'today', 'tomorrow', 'week', 'later', 'someday'];
    for (const t of filtered) {
      const bucket = dueBucket(t.due_at);
      if (!groups[bucket]) groups[bucket] = [];
      groups[bucket].push(t);
    }
    return order.filter(k => groups[k]?.length).map(k => ({ bucket: k, label: BUCKET_LABELS[k], tasks: groups[k] }));
  }, [filtered]);

  const remaining = tasks.filter(t => !done[t.id]).length;

  if (tasks.length === 0) return null;

  return (
    <div style={{ marginBottom: 48, animation: 'fadeUp 0.6s ease 0.12s both' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 13, fontWeight: 300, color: P.inkMuted,
          letterSpacing: 0.3, textTransform: 'uppercase',
        }}>
          Tasks
        </p>
        <p style={{ fontSize: 11, color: P.inkMuted, fontWeight: 300 }}>
          {remaining} remaining
        </p>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 22, flexWrap: 'wrap' }}>
        {filters.map(f => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '5px 14px', borderRadius: 20, cursor: 'pointer',
                fontSize: 11, fontWeight: active ? 600 : 400,
                fontFamily: "'Outfit', sans-serif",
                background: active ? P.pinkSoft : 'rgba(255,255,255,0.5)',
                border: `1px solid ${active ? P.pinkBorder : P.border}`,
                color: active ? P.orchid : P.inkMuted,
                transition: 'all 0.2s',
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Grouped task list */}
      {grouped.map((group, gi) => (
        <div key={group.bucket}>
          {/* Group header — only show if filter is 'all' or 'week' (multi-group) */}
          {(filter === 'all' || filter === 'week') && grouped.length > 1 && (
            <p style={{
              fontSize: 10, fontWeight: 600, color: group.bucket === 'overdue' ? '#D4727A' : P.inkMuted,
              letterSpacing: 0.5, textTransform: 'uppercase', marginTop: gi > 0 ? 20 : 0, marginBottom: 10,
            }}>
              {group.label}
            </p>
          )}

          {group.tasks.map((t, i) => {
            const d = !!done[t.id];
            const barColor = t.projectColor || (t.priority === 'urgent' ? P.pink : t.priority === 'high' ? '#D4A47A' : P.orchid);
            const tag = PRIORITY_TAG[t.priority];
            const dueLabel = formatDue(t.due_at);
            const dueTime = formatDueTime(t.due_at);
            const isOverdue = dueBucket(t.due_at) === 'overdue';

            return (
              <div
                key={t.id}
                onClick={() => toggle(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 0,
                  borderBottom: `1px solid ${P.divider}`,
                  cursor: 'pointer', transition: 'all 0.22s',
                  opacity: d ? 0.38 : 1,
                  animation: `fadeUp 0.4s ease ${0.05 + i * 0.04}s both`,
                }}
              >
                {/* colored left accent bar */}
                <div style={{
                  width: 3, alignSelf: 'stretch', background: d ? P.inkFaint : barColor,
                  borderRadius: 2, flexShrink: 0, marginRight: 16,
                  opacity: d ? 0.3 : 1, transition: 'all 0.2s',
                }} />

                {/* check circle */}
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginRight: 12,
                  border: `1.5px solid ${d ? P.inkFaint : barColor}`,
                  background: d ? barColor : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}>
                  {d && <span style={{ color: 'white', fontSize: 9, fontWeight: 700 }}>✓</span>}
                </div>

                {/* text */}
                <div style={{ flex: 1, minWidth: 0, padding: '14px 0' }}>
                  <p style={{
                    fontSize: 15, fontWeight: d ? 300 : 500,
                    color: d ? P.inkMuted : P.ink,
                    textDecoration: d ? 'line-through' : 'none',
                    letterSpacing: -0.2, marginBottom: 3,
                  }}>
                    {t.isPinned && !d && <span style={{ color: P.orchid, marginRight: 4 }}>●</span>}
                    {t.title}
                  </p>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {t.projectName && (
                      <span style={{ fontSize: 10, color: P.inkMuted, fontWeight: 300 }}>
                        {t.projectName}
                      </span>
                    )}
                    {dueTime && (
                      <span style={{ fontSize: 10, color: P.inkFaint, fontWeight: 300 }}>
                        {dueTime}
                      </span>
                    )}
                  </div>
                </div>

                {/* due date label */}
                {dueLabel && !d && (
                  <span style={{
                    fontSize: 10, fontWeight: 500, flexShrink: 0, marginLeft: 8,
                    color: isOverdue ? '#D4727A' : P.inkMuted,
                  }}>
                    {dueLabel}
                  </span>
                )}

                {/* priority tag */}
                {tag && !d && (
                  <div style={{
                    padding: '3px 10px', borderRadius: 20,
                    background: tag.bg, border: `1px solid ${tag.border}`,
                    flexShrink: 0, marginLeft: 8,
                  }}>
                    <p style={{ fontSize: 9, fontWeight: 700, color: tag.color, letterSpacing: 0.5 }}>
                      {tag.label}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {filtered.length === 0 && (
        <p style={{ fontSize: 13, color: P.inkMuted, fontWeight: 300, padding: '20px 0' }}>
          No tasks match this filter.
        </p>
      )}
    </div>
  );
}
