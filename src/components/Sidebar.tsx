'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Orb from './Orb';
import { createClient } from '@/lib/supabase/client';

const P = {
  ink:          '#2D2026',
  inkSoft:      '#6B5860',
  inkMuted:     '#A8949C',
  inkFaint:     '#D4C8CD',
  orchid:       '#D56989',
  pinkSoft:     'rgba(234,156,175,0.15)',
  pinkBorder:   'rgba(234,156,175,0.30)',
  orchidSoft:   'rgba(213,105,137,0.12)',
  border:       'rgba(45,32,38,0.07)',
  divider:      'rgba(45,32,38,0.05)',
};

const NAV = [
  { href: '/app',               label: 'Home'        },
  { href: '/app/tasks',         label: 'Tasks'       },
  { href: '/app/reminders',     label: 'Reminders'   },
  { href: '/app/projects',      label: 'Projects'    },
  { href: '/app/calendar',      label: 'Calendar'    },
  { href: '/app/settings',      label: 'Settings'    },
];

export default function Sidebar({ name }: { name: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const initial = name?.[0]?.toUpperCase() || 'P';

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside style={{
      width: 210, flexShrink: 0,
      background: 'rgba(247,243,240,0.6)',
      backdropFilter: 'blur(44px)',
      WebkitBackdropFilter: 'blur(44px)',
      borderRight: `1px solid ${P.border}`,
      display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, left: 0, bottom: 0,
      zIndex: 20,
    }}>
      {/* Logo */}
      <div style={{
        padding: '30px 22px 22px',
        display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: `1px solid ${P.divider}`,
      }}>
        <Orb size={24} />
        <span style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 20, fontWeight: 300, letterSpacing: -0.5, color: P.ink,
        }}>
          Pulse
        </span>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {NAV.map(item => {
          const isActive = item.href === '/app'
            ? pathname === '/app'
            : pathname.startsWith(item.href);

          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 12,
                background: isActive ? P.pinkSoft : 'transparent',
                border: isActive ? `1px solid ${P.pinkBorder}` : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}>
                <div style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: isActive ? P.orchid : P.inkFaint,
                  boxShadow: isActive ? '0 0 8px rgba(213,105,137,0.5)' : 'none',
                  flexShrink: 0,
                }} />
                <span style={{
                  fontSize: 14,
                  fontWeight: isActive ? 500 : 300,
                  color: isActive ? P.ink : P.inkSoft,
                }}>
                  {item.label}
                </span>
                {isActive && (
                  <div style={{
                    marginLeft: 'auto', width: 3, height: 3,
                    borderRadius: '50%', background: P.orchid,
                    animation: 'glowPulse 2.5s ease infinite',
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
        borderTop: `1px solid ${P.divider}`,
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: `linear-gradient(135deg, ${P.pinkSoft}, ${P.orchidSoft})`,
            border: `1.5px solid ${P.pinkBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 600, color: P.orchid, flexShrink: 0,
          }}>
            {initial}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: P.ink, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {name}
            </p>
            <p style={{ fontSize: 10, color: P.inkMuted, marginTop: 2 }}>
              {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'} ✦
            </p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          style={{
            background: P.orchidSoft,
            border: `1px solid rgba(213,105,137,0.20)`,
            cursor: 'pointer',
            padding: '7px 14px', borderRadius: 10,
            fontSize: 12, fontWeight: 500, color: P.orchid,
            fontFamily: "'Outfit', sans-serif",
            transition: 'all 0.2s',
            width: '100%',
            textAlign: 'center',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(213,105,137,0.20)';
            e.currentTarget.style.borderColor = 'rgba(213,105,137,0.35)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = P.orchidSoft;
            e.currentTarget.style.borderColor = 'rgba(213,105,137,0.20)';
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
