'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Orb from './Orb';

const NAV = [
  { href: '/app',               icon: '◉', label: 'Home'        },
  { href: '/app/tasks',         icon: '◻', label: 'Tasks'       },
  { href: '/app/goals',         icon: '◎', label: 'Goals'       },
  { href: '/app/relationships', icon: '◑', label: 'People'      },
  { href: '/app/reminders',     icon: '◷', label: 'Reminders'   },
  { href: '/app/projects',      icon: '▦', label: 'Projects'    },
  { href: '/app/settings',      icon: '⚙', label: 'Settings'    },
];

const BOTTOM_NAV = [
  { href: '/app',               icon: '◉', label: 'Home'      },
  { href: '/app/tasks',         icon: '◻', label: 'Tasks'     },
  { href: '/app/goals',         icon: '◎', label: 'Goals'     },
  { href: '/app/relationships', icon: '◑', label: 'People'    },
  { href: '/app/settings',      icon: '⚙', label: 'More'     },
];

export default function Sidebar({ name }: { name: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const initial = name?.[0]?.toUpperCase() || 'P';

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  function isActive(href: string) {
    if (href === '/app') return pathname === '/app';
    return pathname.startsWith(href);
  }

  // For bottom nav, "More" tab covers settings, reminders, projects
  function isBottomActive(href: string) {
    if (href === '/app/settings') {
      return pathname.startsWith('/app/settings') || pathname.startsWith('/app/reminders') || pathname.startsWith('/app/projects');
    }
    return isActive(href);
  }

  return (
    <>
      {/* ─── Desktop sidebar ─── */}
      <aside className="sidebar-desktop" style={{
        width: 210, flexShrink: 0,
        background: '#FFFFFF',
        borderRight: '1px solid rgba(0,0,0,0.07)',
        flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0,
        zIndex: 20,
      }}>
        {/* Logo */}
        <div style={{
          padding: '26px 20px 18px',
          display: 'flex', alignItems: 'center', gap: 10,
          borderBottom: '1px solid rgba(0,0,0,0.05)',
        }}>
          <Orb size={26} animate={false} />
          <span style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 19, fontWeight: 400, color: '#1A1A1A', letterSpacing: -0.2,
          }}>
            Pulse
          </span>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {NAV.map(item => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 10,
                  background: active ? 'rgba(45,184,122,0.09)' : 'transparent',
                  cursor: 'pointer',
                }}>
                  <span style={{
                    fontSize: 13, width: 16, textAlign: 'center', flexShrink: 0,
                    color: active ? '#2DB87A' : '#ABABAB',
                  }}>
                    {item.icon}
                  </span>
                  <span style={{
                    fontSize: 14,
                    fontWeight: active ? 600 : 400,
                    color: active ? '#1A1A1A' : '#4A4A4A',
                    fontFamily: "'DM Sans', sans-serif",
                    letterSpacing: -0.1,
                  }}>
                    {item.label}
                  </span>
                  {active && (
                    <div style={{
                      marginLeft: 'auto', width: 5, height: 5,
                      borderRadius: '50%', background: '#2DB87A', flexShrink: 0,
                    }} />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div style={{
          padding: '14px 18px',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(45,184,122,0.1)',
            border: '1.5px solid rgba(45,184,122,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#2DB87A', flexShrink: 0,
          }}>
            {initial}
          </div>
          <span style={{
            fontSize: 13, fontWeight: 500, color: '#3A3A3A',
            fontFamily: "'DM Sans', sans-serif",
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            flex: 1,
          }}>
            {name}
          </span>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            title="Sign out"
            style={{
              background: 'none', border: 'none', cursor: signingOut ? 'default' : 'pointer',
              color: '#9CA3AF', fontSize: 14, padding: '4px 6px', borderRadius: 6,
              flexShrink: 0, lineHeight: 1,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {signingOut ? '…' : '↪'}
          </button>
        </div>
      </aside>

      {/* ─── Mobile bottom nav ─── */}
      <nav className="bottom-nav">
        {BOTTOM_NAV.map(item => {
          const active = isBottomActive(item.href);
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 2, padding: '6px 12px', borderRadius: 12, minWidth: 56,
              }}>
                <span className="nav-icon" style={{
                  color: active ? '#2DB87A' : '#ABABAB',
                }}>
                  {item.icon}
                </span>
                <span className="nav-label" style={{
                  color: active ? '#2DB87A' : '#9CA3AF',
                  fontWeight: active ? 600 : 500,
                }}>
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
