'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/* ═══ PALETTE ═══ */
var P = {
  bg:"#F7F3F0", bgWarm:"#F2EBE6",
  green:"#C2DC80", greenDark:"#7A9E35", greenSoft:"rgba(194,220,128,0.18)", greenBorder:"rgba(194,220,128,0.35)",
  pink:"#EA9CAF", pinkDark:"#B85A74", pinkSoft:"rgba(234,156,175,0.15)", pinkBorder:"rgba(234,156,175,0.30)",
  orchid:"#D56989", orchidDark:"#8F3552", orchidSoft:"rgba(213,105,137,0.12)", orchidBorder:"rgba(213,105,137,0.25)",
  lilac:"#F3EEF1", lilacDark:"#9B8FA0",
  ink:"#2D2026", inkSoft:"#6B5860", inkMuted:"#A8949C", inkFaint:"#D4C8CD",
  border:"rgba(45,32,38,0.07)", divider:"rgba(45,32,38,0.05)",
};

/* ═══ TYPES ═══ */
interface CalendarConnection {
  id: string;
  provider: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ServiceDef {
  key: string;
  name: string;
  logo: string;
  logoBg: string;
  tagColor: string;
  tag: string;
  desc: string;
  detail: string;
  connectUrl: string | null; // null = not yet supported
}

var SERVICES: ServiceDef[] = [
  {
    key: 'google',
    name: 'Google Calendar',
    logo: 'G',
    logoBg: 'linear-gradient(135deg,#4285F4,#34A853)',
    tagColor: '#4285F4',
    tag: 'Real-time',
    desc: 'Two-way, real-time sync.',
    detail: 'Push updates the moment anything changes. Pulse can read and write events directly to your Google account.',
    connectUrl: '/api/calendar/connect',
  },
  {
    key: 'outlook',
    name: 'Outlook',
    logo: 'O',
    logoBg: 'linear-gradient(135deg,#0078D4,#50E6FF)',
    tagColor: '#0078D4',
    tag: 'OAuth',
    desc: 'Personal Microsoft account.',
    detail: 'Connects via Microsoft Graph OAuth. Works for Outlook.com and Hotmail. Work accounts may require an ICS workaround.',
    connectUrl: null,
  },
  {
    key: 'apple',
    name: 'Apple Calendar',
    logo: '\uF8FF',
    logoBg: 'linear-gradient(135deg,#555,#888)',
    tagColor: '#555',
    tag: 'CalDAV',
    desc: 'CalDAV, polls every 3 min.',
    detail: 'Requires an app-specific password from Apple ID settings. No push notifications \u2014 Pulse checks regularly and syncs changes both ways.',
    connectUrl: null,
  },
  {
    key: 'ics',
    name: 'ICS Feed',
    logo: '\u2B21',
    logoBg: 'linear-gradient(135deg,' + P.lilacDark + ',' + P.orchid + ')',
    tagColor: P.lilacDark,
    tag: 'Read-only',
    desc: 'Any .ics URL, read-only.',
    detail: 'Paste any public calendar feed. Refreshes hourly. Great for work Outlook accounts, school schedules, or public calendars.',
    connectUrl: null,
  },
];

/* ═══ TOGGLE ═══ */
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={function () { onChange(!on); }} style={{
      width: 42, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0,
      background: on ? 'linear-gradient(135deg,' + P.orchid + ',' + P.pink + ')' : 'rgba(45,32,38,0.12)',
      boxShadow: on ? '0 2px 10px rgba(213,105,137,0.35)' : 'none', transition: 'all 0.25s',
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3,
        left: on ? 21 : 3, transition: 'left 0.22s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: '0 1px 4px rgba(45,32,38,0.2)',
      }} />
    </button>
  );
}

/* ═══ LIVE DOT ═══ */
function LiveDot({ syncing }: { syncing: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 7, height: 7, borderRadius: '50%',
        background: syncing ? P.pink : P.green,
        boxShadow: syncing ? '0 0 10px rgba(234,156,175,0.8)' : '0 0 8px rgba(194,220,128,0.7)',
        animation: syncing ? 'syncDot 0.9s ease infinite' : 'livePulse 3s ease infinite',
        flexShrink: 0,
      }} />
      <p style={{ fontSize: 11, fontWeight: 500, color: syncing ? P.pinkDark : P.greenDark }}>
        {syncing ? 'Syncing\u2026' : 'Live'}
      </p>
    </div>
  );
}

/* ═══ SERVICE ROW ═══ */
function ServiceRow({ svc, connected, connectedAt, onConnect, onDisconnect, onSync, syncing, lastSync, idx }: {
  svc: ServiceDef; connected: boolean; connectedAt: string | null;
  onConnect: () => void; onDisconnect: () => void; onSync: () => void;
  syncing: boolean; lastSync: string; idx: number;
}) {
  var [confirming, setConfirming] = useState(false);
  var [expanded, setExpanded] = useState(connected);

  useEffect(function () { if (connected) setExpanded(true); }, [connected]);

  return (
    <div style={{
      borderRadius: 24, overflow: 'hidden',
      background: connected ? 'rgba(255,255,255,0.62)' : 'rgba(255,255,255,0.32)',
      backdropFilter: 'blur(20px)',
      border: '1px solid ' + (connected ? svc.tagColor + '30' : P.border),
      boxShadow: connected
        ? '0 4px 28px ' + svc.tagColor + '12, 0 1px 4px rgba(45,32,38,0.04)'
        : '0 1px 6px rgba(45,32,38,0.04)',
      transition: 'all 0.35s cubic-bezier(0.22,1,0.36,1)',
      animation: 'fadeUp 0.55s ease ' + (0.08 + idx * 0.09) + 's both',
    }}>
      {/* accent stripe */}
      {connected && (
        <div style={{ height: 2.5, background: 'linear-gradient(90deg,' + svc.tagColor + ',' + svc.tagColor + '40)' }} />
      )}

      {/* MAIN ROW */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 0, padding: '20px 24px',
          cursor: connected ? 'pointer' : 'default',
        }}
        onClick={function () { if (connected) setExpanded(!expanded); }}
      >
        {/* Logo */}
        <div style={{
          width: 52, height: 52, borderRadius: 16, flexShrink: 0, marginRight: 20,
          background: svc.logoBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: connected ? 22 : 20, fontWeight: 700, color: 'white',
          boxShadow: '0 4px 16px ' + svc.tagColor + '30',
          transition: 'all 0.3s',
          transform: connected ? 'scale(1)' : 'scale(0.92)',
          opacity: connected ? 1 : 0.65,
        }}>{svc.logo}</div>

        {/* Name + desc */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
            <p style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 300, color: P.ink, letterSpacing: -0.5 }}>{svc.name}</p>
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: 0.6, color: svc.tagColor,
              background: svc.tagColor + '14', border: '1px solid ' + svc.tagColor + '28',
              padding: '2px 8px', borderRadius: 20, flexShrink: 0,
            }}>{svc.tag}</span>
            {connected && <LiveDot syncing={syncing} />}
          </div>
          <p style={{ fontSize: 12, color: P.inkMuted, fontWeight: 300 }}>{svc.desc}</p>
        </div>

        {/* Right action */}
        <div style={{ flexShrink: 0, marginLeft: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          {connected && (
            <span style={{
              fontSize: 12, color: P.inkFaint, transition: 'transform 0.25s',
              display: 'inline-block', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}>{'\u25BE'}</span>
          )}
          {!connected && (
            svc.connectUrl ? (
              <button onClick={function (e) { e.stopPropagation(); onConnect(); }} style={{
                padding: '10px 22px', borderRadius: 20,
                background: 'rgba(255,255,255,0.7)',
                border: '1.5px solid ' + svc.tagColor + '50',
                fontSize: 13, fontWeight: 500, color: svc.tagColor, cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif", transition: 'all 0.22s',
                boxShadow: '0 2px 10px ' + svc.tagColor + '10',
              }}
                onMouseEnter={function (e) { e.currentTarget.style.background = svc.tagColor + '12'; e.currentTarget.style.boxShadow = '0 6px 20px ' + svc.tagColor + '25'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={function (e) { e.currentTarget.style.background = 'rgba(255,255,255,0.7)'; e.currentTarget.style.boxShadow = '0 2px 10px ' + svc.tagColor + '10'; e.currentTarget.style.transform = 'none'; }}
              >Connect {'\u2192'}</button>
            ) : (
              <span style={{
                padding: '8px 16px', borderRadius: 20,
                background: 'rgba(45,32,38,0.04)',
                border: '1px solid ' + P.divider,
                fontSize: 12, fontWeight: 300, color: P.inkFaint,
              }}>Coming soon</span>
            )
          )}
        </div>
      </div>

      {/* EXPANDED DETAIL */}
      {connected && expanded && (
        <div style={{
          borderTop: '1px solid ' + P.divider,
          padding: '18px 24px 20px',
          animation: 'expandIn 0.3s cubic-bezier(0.22,1,0.36,1) both',
        }}>
          <p style={{ fontSize: 12, color: P.inkSoft, fontWeight: 300, lineHeight: 1.7, marginBottom: 16, maxWidth: 480 }}>{svc.detail}</p>

          {/* sync status bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 16px', borderRadius: 14, marginBottom: 16,
            background: 'rgba(45,32,38,0.03)', border: '1px solid ' + P.divider,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <LiveDot syncing={syncing} />
              <span style={{ fontSize: 10, color: P.inkFaint }}>&middot;</span>
              <p style={{ fontSize: 11, color: P.inkMuted, fontWeight: 300 }}>
                {syncing ? 'Syncing now\u2026' : 'Last synced ' + lastSync}
              </p>
            </div>
            <button onClick={function (e) { e.stopPropagation(); onSync(); }} style={{
              fontSize: 11, color: svc.tagColor, background: 'none', border: 'none',
              cursor: syncing ? 'default' : 'pointer', fontWeight: 500,
              fontFamily: "'Outfit',sans-serif", opacity: syncing ? 0.4 : 1,
            }}>Sync now {'\u21BA'}</button>
          </div>

          {/* disconnect */}
          {confirming ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={function (e) { e.stopPropagation(); setConfirming(false); }} style={{
                flex: 1, padding: '9px', borderRadius: 14, background: 'rgba(255,255,255,0.5)',
                border: '1px solid ' + P.border, fontSize: 13, color: P.inkMuted, cursor: 'pointer',
              }}>Cancel</button>
              <button onClick={function (e) { e.stopPropagation(); onDisconnect(); setConfirming(false); setExpanded(false); }} style={{
                flex: 1, padding: '9px', borderRadius: 14,
                background: P.orchidSoft, border: '1px solid ' + P.orchidBorder,
                fontSize: 13, color: P.orchid, cursor: 'pointer', fontWeight: 500,
              }}>Yes, disconnect</button>
            </div>
          ) : (
            <button onClick={function (e) { e.stopPropagation(); setConfirming(true); }} style={{
              width: '100%', padding: '9px', borderRadius: 14,
              background: 'transparent', border: '1px solid rgba(45,32,38,0.08)',
              fontSize: 12, color: P.inkFaint, cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'Outfit',sans-serif",
            }}
              onMouseEnter={function (e) { e.currentTarget.style.color = P.orchid; e.currentTarget.style.borderColor = P.orchidBorder; e.currentTarget.style.background = P.orchidSoft; }}
              onMouseLeave={function (e) { e.currentTarget.style.color = P.inkFaint; e.currentTarget.style.borderColor = 'rgba(45,32,38,0.08)'; e.currentTarget.style.background = 'transparent'; }}
            >Disconnect</button>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══ MAIN COMPONENT ═══ */
export default function SettingsClient({ userName, userEmail, initialConnections }: {
  userName: string;
  userEmail: string;
  initialConnections: CalendarConnection[];
}) {
  var router = useRouter();

  // Build connection state from real DB data
  var [connections, setConnections] = useState<Record<string, { connected: boolean; syncing: boolean; lastSync: string; connectedAt: string | null }>>(() => {
    var state: Record<string, { connected: boolean; syncing: boolean; lastSync: string; connectedAt: string | null }> = {};
    SERVICES.forEach(svc => {
      var conn = initialConnections.find(c => c.provider === svc.key);
      state[svc.key] = {
        connected: !!conn,
        syncing: false,
        lastSync: conn ? formatTimeAgo(conn.updated_at) : '',
        connectedAt: conn?.created_at || null,
      };
    });
    return state;
  });

  var [syncPrefs, setSyncPrefs] = useState({ dashboard: true, blockTime: true, deadlines: false });

  function formatTimeAgo(iso: string): string {
    var diff = Date.now() - new Date(iso).getTime();
    var mins = Math.round(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + ' min ago';
    var hrs = Math.round(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    return Math.round(hrs / 24) + 'd ago';
  }

  // Google connect — redirect to OAuth
  var handleConnect = useCallback(function (key: string) {
    var svc = SERVICES.find(s => s.key === key);
    if (svc?.connectUrl) {
      window.location.href = svc.connectUrl;
    }
  }, []);

  // Disconnect — call API then update state
  var handleDisconnect = useCallback(async function (key: string) {
    try {
      var res = await fetch('/api/calendar/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: key }),
      });
      if (res.ok) {
        setConnections(prev => ({
          ...prev,
          [key]: { ...prev[key], connected: false, syncing: false, lastSync: '' },
        }));
        router.refresh();
      }
    } catch {
      // silent fail
    }
  }, [router]);

  // Sync — hit the check endpoint to verify connection is alive, update lastSync
  var handleSync = useCallback(async function (key: string) {
    setConnections(prev => ({
      ...prev,
      [key]: { ...prev[key], syncing: true },
    }));

    try {
      // For google, hit the check endpoint to verify the connection
      if (key === 'google') {
        var now = new Date();
        var later = new Date(now.getTime() + 3600000);
        await fetch('/api/calendar/check?start=' + now.toISOString() + '&end=' + later.toISOString());
      }
    } catch {
      // silent
    }

    // Simulate sync delay for UX
    setTimeout(function () {
      setConnections(prev => ({
        ...prev,
        [key]: { ...prev[key], syncing: false, lastSync: 'just now' },
      }));
    }, 2200);
  }, []);

  var connectedCount = Object.values(connections).filter(c => c.connected).length;

  return (
    <div style={{ fontFamily: "'Outfit',sans-serif", color: P.ink }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes expandIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glowPulse{0%,100%{opacity:.4}50%{opacity:1}}
        @keyframes syncDot{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.6)}}
        @keyframes livePulse{0%,100%{opacity:.6}50%{opacity:1}}
        button{font-family:'Outfit',sans-serif}
        button:active{transform:scale(0.97)}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:rgba(45,32,38,0.12);border-radius:2px}
        ::selection{background:rgba(213,105,137,0.2);color:#2D2026}
      `}</style>

      <div style={{ maxWidth: 620, margin: '0 auto', padding: '0 44px' }}>
        <div style={{ paddingTop: 52 }}>

          {/* ── HEADER ── */}
          <div style={{ marginBottom: 48, animation: 'fadeUp 0.6s ease both' }}>
            <p style={{ fontSize: 11, color: P.inkMuted, letterSpacing: 0.5, fontWeight: 300, marginBottom: 10 }}>Settings</p>
            <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 46, fontWeight: 200, letterSpacing: -1.5, color: P.ink, lineHeight: 0.95, marginBottom: 14 }}>
              Connect your<br />
              <em style={{ fontStyle: 'italic', color: P.orchid }}>calendars.</em>
            </h1>
            <p style={{ fontSize: 13, color: P.inkMuted, fontWeight: 300, lineHeight: 1.7, maxWidth: 400 }}>
              Let Pulse see your schedule so it can plan smarter, suggest the right times, and keep everything in sync.
            </p>

            {connectedCount > 0 && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 18,
                padding: '7px 16px', borderRadius: 20,
                background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(12px)',
                border: '1px solid ' + P.border,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: P.green, boxShadow: '0 0 8px rgba(194,220,128,0.7)' }} />
                <p style={{ fontSize: 12, fontWeight: 400, color: P.inkSoft }}>
                  <span style={{ fontWeight: 600, color: P.greenDark }}>{connectedCount}</span> calendar{connectedCount !== 1 ? 's' : ''} connected
                </p>
              </div>
            )}
          </div>

          {/* ── SERVICE ROWS ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 44 }}>
            {SERVICES.map(function (svc, i) {
              var state = connections[svc.key];
              return (
                <ServiceRow
                  key={svc.key}
                  svc={svc}
                  connected={state.connected}
                  connectedAt={state.connectedAt}
                  syncing={state.syncing}
                  lastSync={state.lastSync}
                  idx={i}
                  onConnect={function () { handleConnect(svc.key); }}
                  onDisconnect={function () { handleDisconnect(svc.key); }}
                  onSync={function () { handleSync(svc.key); }}
                />
              );
            })}
          </div>

          {/* ── SYNC PREFERENCES ── */}
          <div style={{ animation: 'fadeUp 0.6s ease 0.38s both', marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 18 }}>
              <p style={{ fontFamily: "'Fraunces',serif", fontSize: 13, fontWeight: 300, color: P.inkMuted, letterSpacing: 0.4, textTransform: 'uppercase' }}>Sync preferences</p>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.52)', backdropFilter: 'blur(20px)',
              borderRadius: 22, border: '1px solid ' + P.border, overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(45,32,38,0.04)',
            }}>
              {[
                { k: 'dashboard', label: 'Show events in dashboard', sub: 'Today strip and morning briefing', first: true },
                { k: 'blockTime', label: 'Auto-block time for tasks', sub: 'Pulse schedules tasks into your free slots', first: false },
                { k: 'deadlines', label: 'Sync deadlines to calendar', sub: 'Creates events for task due dates', first: false },
              ].map(function (r) {
                return (
                  <div key={r.k} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
                    padding: '16px 22px', borderTop: r.first ? 'none' : '1px solid ' + P.divider,
                  }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 400, color: P.ink, marginBottom: 2 }}>{r.label}</p>
                      <p style={{ fontSize: 11, color: P.inkMuted, fontWeight: 300 }}>{r.sub}</p>
                    </div>
                    <Toggle on={(syncPrefs as any)[r.k]} onChange={function () { setSyncPrefs(function (p: any) { return { ...p, [r.k]: !p[r.k] }; }); }} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── ACCOUNT ── */}
          <div style={{ animation: 'fadeUp 0.6s ease 0.46s both', marginBottom: 80 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 18 }}>
              <p style={{ fontFamily: "'Fraunces',serif", fontSize: 13, fontWeight: 300, color: P.inkMuted, letterSpacing: 0.4, textTransform: 'uppercase' }}>Account</p>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.52)', backdropFilter: 'blur(20px)',
              borderRadius: 22, border: '1px solid ' + P.border, overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(45,32,38,0.04)',
              padding: '18px 22px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: 'linear-gradient(135deg,' + P.pinkSoft + ',' + P.orchidSoft + ')',
                  border: '1.5px solid ' + P.pinkBorder,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 600, color: P.orchid, flexShrink: 0,
                }}>
                  {userName?.[0]?.toUpperCase() || 'P'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 500, color: P.ink, marginBottom: 2 }}>{userName || 'User'}</p>
                  <p style={{ fontSize: 12, color: P.inkMuted, fontWeight: 300 }}>{userEmail}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
