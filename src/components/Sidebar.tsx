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
];

export default function Sidebar({ name }: { name: string }) {
  const pathname = usePathname();
  const initial = name?.[0]?.toUpperCase() || 'P';

  return (
    <aside style={{
      width: 230, flexShrink: 0,
      background: 'rgba(255,255,255,0.35)',
      backdropFilter: 'blur(40px)',
      WebkitBackdropFilter: 'blur(40px)',
      borderRight: '1px solid rgba(255,255,255,0.3)',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, left: 0, bottom: 0,
      zIndex: 20,
    }}>
      {/* Logo */}
      <div style={{
        padding: '32px 24px 24px',
        display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: '1px solid rgba(0,0,0,0.04)',
      }}>
        <Orb size={26} animate={false} />
        <span style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 22, fontWeight: 400, color: '#2D2A26', letterSpacing: -0.5,
        }}>
          Pulse
        </span>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(item => {
          const isActive = item.href === '/app'
            ? pathname === '/app'
            : pathname.startsWith(item.href);

          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 16px', borderRadius: 12,
                background: isActive ? 'rgba(155,126,200,0.08)' : 'transparent',
                border: isActive ? '1px solid rgba(155,126,200,0.12)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
              }}>
                <span style={{
                  fontSize: 13, width: 16, textAlign: 'center', flexShrink: 0,
                  color: isActive ? '#9B7EC8' : '#9E958B',
                }}>
                  {item.icon}
                </span>
                <span style={{
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#7B5EA8' : '#5C5650',
                  fontFamily: "'Outfit', sans-serif",
                  letterSpacing: -0.1,
                }}>
                  {item.label}
                </span>
                {isActive && (
                  <div style={{
                    marginLeft: 'auto', width: 6, height: 6,
                    borderRadius: '50%',
                    background: '#9B7EC8',
                    boxShadow: '0 0 10px rgba(155,126,200,0.5)',
                    flexShrink: 0,
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
        borderTop: '1px solid rgba(0,0,0,0.04)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(155,126,200,0.12), rgba(212,132,154,0.08))',
          border: '1.5px solid rgba(155,126,200,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: '#9B7EC8', flexShrink: 0,
        }}>
          {initial}
        </div>
        <span style={{
          fontSize: 13, fontWeight: 500, color: '#5C5650',
          fontFamily: "'Outfit', sans-serif",
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {name}
        </span>
      </div>
    </aside>
  );
}
