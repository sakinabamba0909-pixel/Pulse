'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
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

export default function Sidebar({ name }: { name: string }) {
  const pathname = usePathname();
  const initial = name?.[0]?.toUpperCase() || 'P';

  return (
    <aside style={{
      width: 210, flexShrink: 0,
      background: '#FFFFFF',
      borderRight: '1px solid rgba(0,0,0,0.07)',
      display: 'flex', flexDirection: 'column',
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
          const isActive = item.href === '/app'
            ? pathname === '/app'
            : pathname.startsWith(item.href);

          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 10,
                background: isActive ? 'rgba(45,184,122,0.09)' : 'transparent',
                cursor: 'pointer',
              }}>
                <span style={{
                  fontSize: 13, width: 16, textAlign: 'center', flexShrink: 0,
                  color: isActive ? '#2DB87A' : '#ABABAB',
                }}>
                  {item.icon}
                </span>
                <span style={{
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#1A1A1A' : '#4A4A4A',
                  fontFamily: "'DM Sans', sans-serif",
                  letterSpacing: -0.1,
                }}>
                  {item.label}
                </span>
                {isActive && (
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
        }}>
          {name}
        </span>
      </div>
    </aside>
  );
}
