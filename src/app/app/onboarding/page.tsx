'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Orb from '@/components/Orb';

// ─── Typewriter effect ───
function TypeWriter({ text, speed = 35, onDone }: { text: string; speed?: number; onDone?: () => void }) {
  const [shown, setShown] = useState('');
  const idx = useRef(0);
  useEffect(() => {
    idx.current = 0; setShown('');
    const iv = setInterval(() => {
      if (idx.current < text.length) { setShown(text.slice(0, idx.current + 1)); idx.current++; }
      else { clearInterval(iv); onDone?.(); }
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed]);
  return <>{shown}<span style={{ opacity: shown.length < text.length ? 1 : 0, transition: 'opacity 0.3s' }}>|</span></>;
}

// ─── Choice Card ───
function ChoiceCard({ icon, title, desc, selected, onClick, small }: {
  icon: string; title: string; desc?: string; selected: boolean; onClick: () => void; small?: boolean;
}) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: small ? 12 : 16,
      padding: small ? '12px 16px' : '18px 22px', borderRadius: small ? 14 : 18,
      background: selected ? 'rgba(155,126,200,0.10)' : '#FFFFFF',
      border: `1.5px solid ${selected ? '#9B7EC8' : 'rgba(155,126,200,0.25)'}`,
      cursor: 'pointer', transition: 'all 0.25s', textAlign: 'left',
      boxShadow: selected ? '0 0 0 3px rgba(155,126,200,0.10)' : 'none',
      fontFamily: "'Outfit', sans-serif",
    }}>
      <span style={{ fontSize: small ? 22 : 28, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: small ? 14 : 16, fontWeight: 500, color: '#2D2A26', marginBottom: desc ? 2 : 0 }}>{title}</p>
        {desc && <p style={{ fontSize: small ? 12 : 13, color: '#5C5650', lineHeight: 1.4 }}>{desc}</p>}
      </div>
      {selected && <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#9B7EC8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>✓</span>
      </div>}
    </button>
  );
}

// ─── Data constants ───
const CONTACTS = ['Mom', 'Dad', 'Amir (Cousin)', 'Priya (Best friend)', 'Sarah Chen', 'James Wilson', 'Nana', 'Brother - Yusuf', 'Aunt Fatima', 'Coach Mike', 'Roommate - Leila'];
const GOAL_OPTIONS = [
  { id: 'fitness', icon: '💪', label: 'Get healthier' }, { id: 'language', icon: '🗣️', label: 'Learn a language' },
  { id: 'career', icon: '📈', label: 'Grow my career' }, { id: 'finance', icon: '💰', label: 'Better with money' },
  { id: 'social', icon: '👥', label: 'Stay connected' }, { id: 'creative', icon: '🎨', label: 'Creative project' },
  { id: 'organize', icon: '🏠', label: 'Get organized' }, { id: 'mindful', icon: '🧘', label: 'Reduce stress' },
];
const AI_TOOLS = [
  { id: 'claude', name: 'Claude', icon: '◉', color: '#D4A574', desc: 'Anthropic' },
  { id: 'chatgpt', name: 'ChatGPT', icon: '◈', color: '#10A37F', desc: 'OpenAI' },
  { id: 'gemini', name: 'Gemini', icon: '◇', color: '#4285F4', desc: 'Google' },
  { id: 'copilot', name: 'Copilot', icon: '◆', color: '#0078D4', desc: 'Microsoft' },
];
const NEWS_OUTLETS = [
  { id: 'ap', name: 'AP News', icon: '📰' }, { id: 'reuters', name: 'Reuters', icon: '🌐' },
  { id: 'bbc', name: 'BBC', icon: '🇬🇧' }, { id: 'nyt', name: 'New York Times', icon: '📄' },
  { id: 'cnn', name: 'CNN', icon: '📺' }, { id: 'wsj', name: 'Wall Street Journal', icon: '💼' },
  { id: 'npr', name: 'NPR', icon: '🎙' }, { id: 'guardian', name: 'The Guardian', icon: '🗞' },
];

const TOTAL_STEPS = 13;

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [typed, setTyped] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Profile state
  const [name, setName] = useState('');
  const [responseMode, setResponseMode] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [contactFreqs, setContactFreqs] = useState<Record<string, string>>({});
  const [textsAccess, setTextsAccess] = useState<boolean | null>(null);
  const [goals, setGoals] = useState<string[]>([]);
  const [wakeTime, setWakeTime] = useState('');
  const [windDown, setWindDown] = useState('');
  const [tone, setTone] = useState('');
  const [pushiness, setPushiness] = useState('');
  const [aiTools, setAiTools] = useState<string[]>([]);
  const [newsEnabled, setNewsEnabled] = useState<boolean | null>(null);
  const [newsTone, setNewsTone] = useState('');
  const [newsOutlets, setNewsOutlets] = useState<string[]>([]);
  const [briefingFormat, setBriefingFormat] = useState('');
  const [briefingTime, setBriefingTime] = useState('');

  const progress = Math.min(step / TOTAL_STEPS, 1);

  const next = () => { setTransitioning(true); setTyped(false); setTimeout(() => { setStep(s => s + 1); setTransitioning(false); }, 350); };
  const back = () => { setTransitioning(true); setTyped(false); setTimeout(() => { setStep(s => s - 1); setTransitioning(false); }, 350); };
  const toggle = (arr: string[], set: (v: string[]) => void, val: string) => set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);

  const canNext = () => {
    switch (step) {
      case 0: return true;
      case 1: return name.trim().length > 0;
      case 2: return responseMode !== '';
      case 3: return true;
      case 4: return selectedContacts.length === 0 || selectedContacts.every(c => contactFreqs[c]);
      case 5: return textsAccess !== null;
      case 6: return goals.length > 0;
      case 7: return wakeTime !== '' && windDown !== '';
      case 8: return tone !== '' && pushiness !== '';
      case 9: return true;
      case 10: return newsEnabled !== null;
      case 11: return briefingFormat !== '';
      case 12: return briefingTime !== '';
      default: return true;
    }
  };

  // ─── Save to Supabase ───
  const finishOnboarding = async () => {
    setSaving(true);
    try {
      const contacts = selectedContacts.map(c => ({
        name: c,
        category: c.includes('Mom') || c.includes('Dad') || c.includes('Cousin') || c.includes('Brother') || c.includes('Nana') || c.includes('Aunt') ? 'family' : 'friend',
        frequency: contactFreqs[c] || 'weekly',
      }));

      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          response_mode: responseMode,
          contacts,
          goals,
          wake_time: wakeTime.replace(' AM', ':00').replace(' PM', ':00'),
          wind_down_time: windDown.replace(' PM', ':00').replace(' AM', ':00'),
          tone,
          pushiness,
          briefing_time: briefingTime.replace(' AM', ':00'),
          briefing_format: briefingFormat,
          news_enabled: newsEnabled || false,
          news_tone: newsTone || 'balanced',
          news_outlets: newsOutlets,
          ai_tools: aiTools,
          texts_access: textsAccess || false,
        }),
      });

      if (!res.ok) throw new Error('Failed to save');

      // Redirect to main app
      router.push('/app');
      router.refresh();
    } catch (err) {
      console.error('Onboarding save error:', err);
      alert('Something went wrong saving your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Common styles
  const S = {
    orbMsg: { display: 'flex', alignItems: 'flex-start' as const, gap: 10, marginBottom: 24 },
    hint: { fontSize: 12, color: '#9E958B', marginTop: 10, marginLeft: 4 },
    card: { background: '#FFFFFF', borderRadius: 18, border: '1px solid rgba(155,126,200,0.25)', padding: 22, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)' },
    chip: (sel: boolean) => ({
      padding: '8px 16px', borderRadius: 20,
      background: sel ? '#9B7EC8' : '#FFFFFF',
      border: `1.5px solid ${sel ? '#9B7EC8' : 'rgba(155,126,200,0.25)'}`,
      color: sel ? 'white' : '#2D2A26',
      fontSize: 13, fontWeight: 500 as const, cursor: 'pointer',
      transition: 'all 0.2s', fontFamily: "'Outfit', sans-serif",
    }),
    timeBtn: (sel: boolean) => ({
      flex: 1, padding: '10px 8px', borderRadius: 10,
      background: sel ? '#9B7EC8' : '#F5F5F3',
      border: `1px solid ${sel ? '#9B7EC8' : 'rgba(155,126,200,0.25)'}`,
      color: sel ? 'white' : '#2D2A26',
      fontSize: 12, fontWeight: 500 as const, cursor: 'pointer',
      transition: 'all 0.15s', fontFamily: "'Outfit', sans-serif",
    }),
  };

  return (
    <div style={{ background: 'transparent', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Outfit', sans-serif", color: '#2D2A26' }}>
      {/* Progress bar */}
      {step > 0 && step <= TOTAL_STEPS && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10 }}>
          <div style={{ height: 3, background: 'rgba(155,126,200,0.25)' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg, #9B7EC8, #34D399)', width: `${progress * 100}%`, transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)', borderRadius: '0 2px 2px 0' }} />
          </div>
        </div>
      )}

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px',
        opacity: transitioning ? 0 : 1, transform: transitioning ? 'translateY(-8px)' : 'translateY(0)', transition: 'opacity 0.3s, transform 0.3s',
      }}>
        <div style={{ width: '100%', maxWidth: 480 }}>

          {/* STEP 0: Welcome */}
          {step === 0 && <div style={{ textAlign: 'center', animation: 'fadeIn 0.8s ease' }}>
            <div style={{ marginBottom: 32 }}><Orb size={140} /></div>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 42, fontWeight: 400, letterSpacing: -0.5, marginBottom: 12, lineHeight: 1.1 }}>
              <TypeWriter text="Hello. I'm Pulse." speed={50} onDone={() => setTyped(true)} />
            </h1>
            {typed && <div style={{ animation: 'fadeIn 0.6s ease' }}>
              <p style={{ fontSize: 17, color: '#5C5650', lineHeight: 1.6, marginBottom: 40, maxWidth: 360, margin: '0 auto 40px' }}>
                Your personal assistant for life — tasks, goals, relationships, and everything in between.
              </p>
              <button onClick={next} style={{ padding: '16px 48px', borderRadius: 16, background: '#9B7EC8', color: 'white', border: 'none', fontSize: 16, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 16px rgba(155,126,200,0.35)', fontFamily: "'Outfit', sans-serif" }}>
                Let's get started
              </button>
              <p style={{ fontSize: 12, color: '#9E958B', marginTop: 16 }}>Takes about 3 minutes</p>
            </div>}
          </div>}

          {/* STEP 1: Name */}
          {step === 1 && <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <div style={S.orbMsg}><Orb size={36} animate={false} /><p style={{ fontSize: 16, color: '#5C5650' }}>First — what should I call you?</p></div>
            <input type="text" placeholder="Your first name" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && canNext() && next()} autoFocus
              style={{ width: '100%', padding: '18px 22px', borderRadius: 16, border: `1.5px solid ${name ? '#9B7EC8' : 'rgba(155,126,200,0.25)'}`, background: '#FFFFFF', fontSize: 20, fontWeight: 500, color: '#2D2A26', fontFamily: "'Outfit', sans-serif", boxShadow: name ? '0 0 0 3px rgba(155,126,200,0.10)' : 'none', transition: 'all 0.2s' }} />
            <p style={S.hint}>This is how I'll greet you each day</p>
          </div>}

          {/* STEP 2: Response Mode */}
          {step === 2 && <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <div style={S.orbMsg}><Orb size={36} animate={false} /><p style={{ fontSize: 16, color: '#5C5650' }}>How should I talk to you?</p></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <ChoiceCard icon="🔊" title="Talk to me" desc="I'll speak responses aloud — hands-free" selected={responseMode === 'voice'} onClick={() => setResponseMode('voice')} />
              <ChoiceCard icon="💬" title="Text me" desc="Silent mode — like a chat" selected={responseMode === 'text'} onClick={() => setResponseMode('text')} />
              <ChoiceCard icon="🔊💬" title="Both" desc="Audio + written record" selected={responseMode === 'hybrid'} onClick={() => setResponseMode('hybrid')} />
            </div>
            <p style={S.hint}>You can change this anytime</p>
          </div>}

          {/* STEP 3: Contacts */}
          {step === 3 && <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <div style={S.orbMsg}><Orb size={36} animate={false} /><p style={{ fontSize: 16, color: '#5C5650', lineHeight: 1.5 }}>Who matters most to you? I'll only track the people you select.</p></div>
            <div style={{ ...S.card, marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#9E958B', marginBottom: 12, letterSpacing: 0.3, textTransform: 'uppercase' as const }}>From your contacts</p>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
                {CONTACTS.map(c => <button key={c} onClick={() => toggle(selectedContacts, setSelectedContacts, c)} style={S.chip(selectedContacts.includes(c))}>
                  {selectedContacts.includes(c) ? `✓ ${c}` : c}
                </button>)}
              </div>
            </div>
            <p style={S.hint}>{selectedContacts.length === 0 ? "Skip if you'd rather add later" : `${selectedContacts.length} selected`}</p>
          </div>}

          {/* STEP 4: Contact Frequency */}
          {step === 4 && <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <div style={S.orbMsg}><Orb size={36} animate={false} /><p style={{ fontSize: 16, color: '#5C5650' }}>{selectedContacts.length > 0 ? 'How often for each person?' : 'No contacts selected — you can add later.'}</p></div>
            {selectedContacts.length > 0 && <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto' as const }}>
              {selectedContacts.map(c => <div key={c} style={{ ...S.card, padding: '14px 18px' }}>
                <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>{c}</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['Daily', 'Weekly', 'Biweekly', 'Monthly'].map(f => <button key={f} onClick={() => setContactFreqs(p => ({ ...p, [c]: f }))} style={S.timeBtn(contactFreqs[c] === f)}>{f}</button>)}
                </div>
              </div>)}
            </div>}
          </div>}

          {/* STEP 5: Texts Access */}
          {step === 5 && <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <div style={S.orbMsg}><Orb size={36} animate={false} /><p style={{ fontSize: 16, color: '#5C5650', lineHeight: 1.5 }}>Can I check your messages? I only look at dates — never content.</p></div>
            <div style={S.card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 24 }}>🔒</span>
                <div><p style={{ fontSize: 14, fontWeight: 600 }}>Privacy first</p><p style={{ fontSize: 12, color: '#5C5650' }}>Only tracks last-contact dates for your selected people.</p></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <ChoiceCard small icon="✓" title="Allow message access" desc="Only for selected people" selected={textsAccess === true} onClick={() => setTextsAccess(true)} />
                <ChoiceCard small icon="✗" title="Skip for now" desc="I'll ask manually when needed" selected={textsAccess === false} onClick={() => setTextsAccess(false)} />
              </div>
            </div>
          </div>}

          {/* STEP 6: Goals */}
          {step === 6 && <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <div style={S.orbMsg}><Orb size={36} animate={false} /><p style={{ fontSize: 16, color: '#5C5650' }}>What are you working towards?</p></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              {GOAL_OPTIONS.map(g => <button key={g.id} onClick={() => toggle(goals, setGoals, g.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 14,
                background: goals.includes(g.id) ? 'rgba(155,126,200,0.10)' : '#FFFFFF',
                border: `1.5px solid ${goals.includes(g.id) ? '#9B7EC8' : 'rgba(155,126,200,0.25)'}`,
                cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' as const, fontFamily: "'Outfit', sans-serif",
              }}>
                <span style={{ fontSize: 20 }}>{g.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: goals.includes(g.id) ? '#9B7EC8' : '#2D2A26' }}>{g.label}</span>
              </button>)}
            </div>
            {goals.length > 0 && <p style={{ fontSize: 12, color: '#9B7EC8', marginTop: 10, fontWeight: 500 }}>{goals.length} area{goals.length > 1 ? 's' : ''} selected</p>}
          </div>}

          {/* STEP 7: Daily Rhythm */}
          {step === 7 && <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <div style={S.orbMsg}><Orb size={36} animate={false} /><p style={{ fontSize: 16, color: '#5C5650' }}>Tell me about your daily rhythm.</p></div>
            {[{ q: '☀ Day starts at?', val: wakeTime, set: setWakeTime, opts: ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM'] },
              { q: '🌙 Wind down at?', val: windDown, set: setWindDown, opts: ['8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM'] }].map((s, i) => (
              <div key={i} style={{ ...S.card, marginBottom: 14 }}>
                <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{s.q}</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {s.opts.map(t => <button key={t} onClick={() => s.set(t)} style={S.timeBtn(s.val === t)}>{t}</button>)}
                </div>
              </div>
            ))}
          </div>}

          {/* STEP 8: Tone */}
          {step === 8 && <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <div style={S.orbMsg}><Orb size={36} animate={false} /><p style={{ fontSize: 16, color: '#5C5650' }}>Almost done — personality questions.</p></div>
            <div style={{ ...S.card, marginBottom: 14 }}>
              <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>How should I sound?</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[{ id: 'warm', l: 'Warm & friendly', d: 'Like a good friend', i: '☀' }, { id: 'calm', l: 'Calm & minimal', d: 'Quiet, to the point', i: '🌿' }, { id: 'pro', l: 'Professional', d: 'Efficient, polished', i: '💼' }, { id: 'hype', l: 'Encouraging', d: 'Upbeat, motivating', i: '🔥' }].map(t =>
                  <ChoiceCard key={t.id} small icon={t.i} title={t.l} desc={t.d} selected={tone === t.id} onClick={() => setTone(t.id)} />)}
              </div>
            </div>
            <div style={S.card}>
              <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>How pushy should I be?</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[{ id: 'gentle', l: 'Gentle nudges', d: 'No pressure', i: '🕊' }, { id: 'balanced', l: 'Balanced', d: "Remind, don't nag", i: '⚖' }, { id: 'firm', l: 'Hold me accountable', d: 'Be direct', i: '🎯' }].map(p =>
                  <ChoiceCard key={p.id} small icon={p.i} title={p.l} desc={p.d} selected={pushiness === p.id} onClick={() => setPushiness(p.id)} />)}
              </div>
            </div>
          </div>}

          {/* STEP 9: AI Tools */}
          {step === 9 && <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <div style={S.orbMsg}><Orb size={36} animate={false} /><p style={{ fontSize: 16, color: '#5C5650', lineHeight: 1.5 }}>Do you use any AI tools? I can track your project progress across them.</p></div>
            <div style={{ ...S.card, marginBottom: 12 }}>
              <p style={{ fontSize: 12, color: '#5C5650', lineHeight: 1.6, marginBottom: 16 }}>I'll check your recent project chats to give you smart reminders and progress updates. You choose which projects I can see.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {AI_TOOLS.map(t => (
                  <button key={t.id} onClick={() => toggle(aiTools, setAiTools, t.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 14,
                    background: aiTools.includes(t.id) ? 'rgba(155,126,200,0.10)' : '#FFFFFF',
                    border: `1.5px solid ${aiTools.includes(t.id) ? '#9B7EC8' : 'rgba(155,126,200,0.25)'}`,
                    cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' as const, width: '100%', fontFamily: "'Outfit', sans-serif",
                  }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: `${t.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: t.color, fontWeight: 700 }}>{t.icon}</div>
                    <div style={{ flex: 1 }}><p style={{ fontSize: 14, fontWeight: 600 }}>{t.name}</p><p style={{ fontSize: 11, color: '#5C5650' }}>{t.desc}</p></div>
                    {aiTools.includes(t.id) && <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#9B7EC8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>✓</span></div>}
                  </button>
                ))}
              </div>
            </div>
            <p style={S.hint}>{aiTools.length === 0 ? "Skip if you don't use these" : `${aiTools.length} tool${aiTools.length > 1 ? 's' : ''} selected`}</p>
          </div>}

          {/* STEP 10: News */}
          {step === 10 && <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <div style={S.orbMsg}><Orb size={36} animate={false} /><p style={{ fontSize: 16, color: '#5C5650', lineHeight: 1.5 }}>Want world news in your morning briefing?</p></div>
            <div style={{ ...S.card, marginBottom: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: newsEnabled ? 16 : 0 }}>
                <ChoiceCard small icon="🌍" title="Yes, include world news" desc="Top stories alongside your personal briefing" selected={newsEnabled === true} onClick={() => setNewsEnabled(true)} />
                <ChoiceCard small icon="✗" title="No news, just my life" desc="Keep the briefing personal only" selected={newsEnabled === false} onClick={() => setNewsEnabled(false)} />
              </div>
              {newsEnabled && <>
                <div style={{ borderTop: '1px solid rgba(155,126,200,0.25)', paddingTop: 16, marginBottom: 16 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>What kind of news?</p>
                  <p style={{ fontSize: 12, color: '#5C5650', marginBottom: 12 }}>This shapes how the world feels when you wake up</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[{ id: 'positive', i: '☀', l: 'Positive news only', d: 'Progress, science, kindness' },
                      { id: 'balanced', i: '⚖', l: 'Balanced mix', d: 'Important stories, grounded tone' },
                      { id: 'full', i: '🌐', l: 'Full reality', d: 'All major stories, unfiltered' }
                    ].map(t => <ChoiceCard key={t.id} small icon={t.i} title={t.l} desc={t.d} selected={newsTone === t.id} onClick={() => setNewsTone(t.id)} />)}
                  </div>
                </div>
                <div style={{ borderTop: '1px solid rgba(155,126,200,0.25)', paddingTop: 16 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Preferred sources</p>
                  <p style={{ fontSize: 12, color: '#5C5650', marginBottom: 12 }}>Optional — or I'll pick the best sources</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                    {NEWS_OUTLETS.map(n => <button key={n.id} onClick={() => toggle(newsOutlets, setNewsOutlets, n.id)} style={S.chip(newsOutlets.includes(n.id))}>{n.icon} {n.name}</button>)}
                  </div>
                </div>
              </>}
            </div>
          </div>}

          {/* STEP 11: Briefing Format */}
          {step === 11 && <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <div style={S.orbMsg}><Orb size={36} animate={false} /><p style={{ fontSize: 16, color: '#5C5650', lineHeight: 1.5 }}>How should your morning briefing arrive?</p></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <ChoiceCard icon="🔔" title="Wake me up with it" desc="Pulse becomes your alarm — starts speaking your briefing at the time you choose." selected={briefingFormat === 'alarm'} onClick={() => setBriefingFormat('alarm')} />
              <ChoiceCard icon="📖" title="Beautiful written briefing" desc="A calm, one-thing-at-a-time written briefing waiting when you open the app." selected={briefingFormat === 'written'} onClick={() => setBriefingFormat('written')} />
              <ChoiceCard icon="🔊📖" title="Both — alarm + written" desc="Speaks the highlights as your alarm, full written version in the app." selected={briefingFormat === 'both'} onClick={() => setBriefingFormat('both')} />
            </div>
          </div>}

          {/* STEP 12: Briefing Time */}
          {step === 12 && <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <div style={S.orbMsg}><Orb size={36} animate={false} /><p style={{ fontSize: 16, color: '#5C5650' }}>{briefingFormat === 'alarm' || briefingFormat === 'both' ? 'What time should I wake you up?' : 'When should your briefing be ready?'}</p></div>
            <div style={S.card}>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
                {['6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM'].map(t => <button key={t} onClick={() => setBriefingTime(t)} style={{
                  padding: '10px 18px', borderRadius: 12,
                  background: briefingTime === t ? '#9B7EC8' : '#FFFFFF',
                  border: `1.5px solid ${briefingTime === t ? '#9B7EC8' : 'rgba(155,126,200,0.25)'}`,
                  color: briefingTime === t ? 'white' : '#2D2A26',
                  fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', fontFamily: "'Outfit', sans-serif",
                }}>{t}</button>)}
              </div>
              {briefingTime && <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 12, background: 'rgba(155,126,200,0.10)', animation: 'fadeIn 0.3s ease' }}>
                <p style={{ fontSize: 13, color: '#9B7EC8', fontWeight: 500 }}>
                  {briefingFormat === 'alarm' || briefingFormat === 'both' ? `✓ I'll wake you at ${briefingTime}` : `✓ Briefing at ${briefingTime} daily`}
                </p>
              </div>}
            </div>
          </div>}

          {/* STEP 13: Complete */}
          {step === 13 && <div style={{ textAlign: 'center', animation: 'fadeIn 0.8s ease' }}>
            <div style={{ marginBottom: 28, animation: 'float 3s ease infinite' }}><Orb size={120} /></div>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 36, fontWeight: 400, marginBottom: 8 }}>You're all set, {name}.</h1>
            <p style={{ fontSize: 16, color: '#5C5650', lineHeight: 1.6, maxWidth: 380, margin: '0 auto 28px' }}>I know your rhythm, your people, your goals, and how you like to start your day.</p>
            <div style={{ ...S.card, padding: 24, textAlign: 'left' as const, marginBottom: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 12px 32px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#9E958B', marginBottom: 14, letterSpacing: 0.4, textTransform: 'uppercase' as const }}>Your profile</p>
              {[
                { l: 'Mode', v: responseMode === 'voice' ? '🔊 Voice' : responseMode === 'text' ? '💬 Text' : '🔊💬 Hybrid' },
                { l: 'People', v: selectedContacts.length > 0 ? selectedContacts.slice(0, 3).join(', ') + (selectedContacts.length > 3 ? ` +${selectedContacts.length - 3}` : '') : 'None yet' },
                { l: 'Goals', v: goals.map(g => GOAL_OPTIONS.find(o => o.id === g)?.icon).join(' ') || 'None' },
                { l: 'AI Tools', v: aiTools.map(a => AI_TOOLS.find(t => t.id === a)?.name).join(', ') || 'None' },
                { l: 'News', v: newsEnabled ? ({ positive: '☀ Positive', balanced: '⚖ Balanced', full: '🌐 Full' }[newsTone] || 'On') : 'Off' },
                { l: 'Briefing', v: `${briefingTime} · ${({ alarm: '🔔 Alarm', written: '📖 Written', both: '🔔📖 Both' }[briefingFormat]) || ''}` },
                { l: 'Tone', v: ({ warm: 'Warm', calm: 'Calm', pro: 'Professional', hype: 'Encouraging' }[tone]) || '—' },
              ].map((r, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < 6 ? '1px solid #F5F5F3' : 'none' }}>
                <span style={{ fontSize: 12, color: '#9E958B' }}>{r.l}</span>
                <span style={{ fontSize: 12, color: '#2D2A26', fontWeight: 500 }}>{r.v}</span>
              </div>)}
            </div>
            <button onClick={finishOnboarding} disabled={saving} style={{
              padding: '16px 48px', borderRadius: 16,
              background: saving ? 'rgba(155,126,200,0.25)' : '#9B7EC8',
              color: saving ? '#9E958B' : 'white', border: 'none',
              fontSize: 16, fontWeight: 600,
              cursor: saving ? 'default' : 'pointer',
              boxShadow: saving ? 'none' : '0 4px 16px rgba(155,126,200,0.35)',
              fontFamily: "'Outfit', sans-serif",
            }}>
              {saving ? 'Setting up your world...' : 'Open Pulse'}
            </button>
          </div>}

          {/* Navigation */}
          {step > 0 && step < 13 && <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
            <button onClick={back} style={{ padding: '10px 20px', borderRadius: 12, background: 'transparent', border: '1px solid rgba(155,126,200,0.25)', color: '#5C5650', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>← Back</button>
            <span style={{ fontSize: 12, color: '#9E958B' }}>{step} of 12</span>
            <button onClick={next} disabled={!canNext()} style={{
              padding: '10px 24px', borderRadius: 12,
              background: canNext() ? '#9B7EC8' : '#F5F5F3',
              border: 'none', color: canNext() ? 'white' : '#9E958B',
              fontSize: 13, fontWeight: 600,
              cursor: canNext() ? 'pointer' : 'default',
              transition: 'all 0.2s', fontFamily: "'Outfit', sans-serif",
            }}>Continue →</button>
          </div>}
        </div>
      </div>
    </div>
  );
}
