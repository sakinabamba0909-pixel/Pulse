'use client';

import { useState } from 'react';

const CATEGORY_META: Record<string, { icon: string }> = {
  fitness:  { icon: '💪' }, language: { icon: '🗣️' }, career:  { icon: '📈' },
  finance:  { icon: '💰' }, social:   { icon: '👥' }, creative: { icon: '🎨' },
  organize: { icon: '🏠' }, mindful:  { icon: '🧘' },
};

const STATUS_STYLES: Record<string, { bg: string; border: string; dot: string; label: string; text: string }> = {
  pending: { bg: 'rgba(136,144,160,0.10)', border: 'rgba(136,144,160,0.2)', dot: '#8890A0', label: 'Pending', text: '#8890A0' },
  active:  { bg: 'rgba(139,126,200,0.10)', border: 'rgba(139,126,200,0.2)', dot: '#8B7EC8', label: 'Active', text: '#8B7EC8' },
  done:    { bg: 'rgba(45,184,122,0.10)',   border: 'rgba(45,184,122,0.2)', dot: '#2DB87A', label: 'Done',   text: '#2DB87A' },
};

interface Step {
  id: string;
  project_id: string;
  step_number: number;
  name: string;
  description?: string | null;
  status?: string;
  estimated_hours?: number | null;
}

interface Task {
  id: string;
  project_id: string;
  step_id?: string | null;
  title: string;
  status?: string;
  due_at?: string | null;
  duration_minutes?: number | null;
}

interface Project {
  id: string;
  name: string;
  category?: string;
  status?: string;
  description?: string | null;
  start_date?: string | null;
  target_date?: string | null;
}

interface Props {
  projects: Project[];
  steps: Step[];
  tasks: Task[];
}

export default function ProjectsClient({ projects, steps, tasks }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const stepsForProject = (pid: string) => steps.filter(s => s.project_id === pid).sort((a, b) => a.step_number - b.step_number);
  const tasksForStep = (sid: string) => tasks.filter(t => t.step_id === sid);
  const tasksForProject = (pid: string) => tasks.filter(t => t.project_id === pid);

  return (
    <div style={{ padding: '64px 40px', fontFamily: "'Outfit', sans-serif", color: '#2A2D35' }}>
      <p style={{ fontSize: 12, color: '#8890A0', marginBottom: 8, letterSpacing: 0.2 }}>Projects</p>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 38, fontWeight: 400, letterSpacing: -0.5, margin: '0 0 6px' }}>
        Things in motion.
      </h1>
      <p style={{ fontSize: 15, color: '#8890A0', marginBottom: 48 }}>
        {projects.length > 0
          ? `${projects.length} project${projects.length !== 1 ? 's' : ''} active.`
          : 'Your ongoing projects and initiatives live here.'}
      </p>

      {projects.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14, maxWidth: 740 }}>
          {projects.map(p => {
            const meta = CATEGORY_META[p.category ?? ''] || { icon: '▦' };
            const pSteps = stepsForProject(p.id);
            const pTasks = tasksForProject(p.id);
            const doneSteps = pSteps.filter(s => s.status === 'done').length;
            const doneTasks = pTasks.filter(t => t.status === 'done').length;
            const isExpanded = expandedId === p.id;
            const statusKey = p.status ?? 'active';
            const sStyle = STATUS_STYLES[statusKey] ?? STATUS_STYLES.active;

            return (
              <div
                key={p.id}
                onClick={() => setExpandedId(isExpanded ? null : p.id)}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(255,255,255,0.25)',
                  borderRadius: 20,
                  padding: '22px 22px',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.25s cubic-bezier(0.4,0,0.2,1)',
                  boxShadow: isExpanded ? '0 8px 32px rgba(139,126,200,0.12)' : 'none',
                }}
              >
                <span style={{ fontSize: 26, display: 'block', marginBottom: 14 }}>{meta.icon}</span>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#2A2D35', marginBottom: 4 }}>{p.name}</p>
                {p.category && (
                  <p style={{ fontSize: 12, color: '#8890A0', textTransform: 'capitalize', marginBottom: 4 }}>{p.category}</p>
                )}

                {/* Progress bar */}
                {pSteps.length > 0 && (
                  <div style={{ marginTop: 10, marginBottom: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8890A0', marginBottom: 4 }}>
                      <span>{doneSteps}/{pSteps.length} steps</span>
                      {pTasks.length > 0 && <span>{doneTasks}/{pTasks.length} tasks</span>}
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'rgba(139,126,200,0.10)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pSteps.length > 0 ? (doneSteps / pSteps.length) * 100 : 0}%`,
                        background: 'linear-gradient(135deg, #8B7EC8, #C8889E)',
                        borderRadius: 2,
                        transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
                      }} />
                    </div>
                  </div>
                )}

                {/* Status badge */}
                <div style={{
                  marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 10px', borderRadius: 20,
                  background: sStyle.bg, border: `1px solid ${sStyle.border}`,
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: sStyle.dot }} />
                  <span style={{ fontSize: 11, color: sStyle.text, fontWeight: 500 }}>{sStyle.label}</span>
                </div>

                {/* Expanded steps */}
                {isExpanded && pSteps.length > 0 && (
                  <div style={{ marginTop: 16, borderTop: '1px solid rgba(139,126,200,0.10)', paddingTop: 14 }}>
                    {pSteps.map(step => {
                      const sTasks = tasksForStep(step.id);
                      const stepStyle = STATUS_STYLES[step.status ?? 'pending'] ?? STATUS_STYLES.pending;
                      return (
                        <div key={step.id} style={{ marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: stepStyle.dot, flexShrink: 0 }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#2A2D35' }}>
                              {step.step_number}. {step.name}
                            </span>
                            {step.estimated_hours != null && (
                              <span style={{ fontSize: 11, color: '#8890A0', marginLeft: 'auto' }}>
                                {step.estimated_hours}h
                              </span>
                            )}
                          </div>
                          {step.description && (
                            <p style={{ fontSize: 12, color: '#8890A0', marginLeft: 14, marginBottom: 4, lineHeight: 1.4 }}>
                              {step.description}
                            </p>
                          )}
                          {sTasks.length > 0 && (
                            <div style={{ marginLeft: 14 }}>
                              {sTasks.map(t => (
                                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                  <span style={{ fontSize: 11, color: t.status === 'done' ? '#2DB87A' : '#8890A0' }}>
                                    {t.status === 'done' ? '✓' : '○'}
                                  </span>
                                  <span style={{
                                    fontSize: 12, color: t.status === 'done' ? '#8890A0' : '#4A4E5A',
                                    textDecoration: t.status === 'done' ? 'line-through' : 'none',
                                  }}>
                                    {t.title}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{
          background: '#FFFFFF', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 20,
          padding: '48px 40px', textAlign: 'center', maxWidth: 480,
        }}>
          <p style={{ fontSize: 32, marginBottom: 16 }}>▦</p>
          <p style={{ fontSize: 16, fontWeight: 500, color: '#2A2D35', marginBottom: 6 }}>No projects yet</p>
          <p style={{ fontSize: 14, color: '#8890A0', lineHeight: 1.6 }}>
            Projects linked to your goals will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
