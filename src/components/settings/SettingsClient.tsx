'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const C = {
  bg: '#F0EBE6',
  ink: '#2D2A26',
  soft: '#5C5650',
  muted: '#9E958B',
  faint: '#C9C1B8',
  accent: '#9B7EC8',
  accentDim: 'rgba(155,126,200,0.10)',
  accentBorder: 'rgba(155,126,200,0.25)',
  card: 'rgba(255,255,255,0.52)',
  cardBorder: 'rgba(0,0,0,0.05)',
  urgent: '#D4727A',
  green: '#5BAD7A',
}

interface Props {
  userName: string
  userEmail: string
  calendarConnected: boolean
  calendarConnectedAt: string | null
}

export default function SettingsClient({ userName, userEmail, calendarConnected, calendarConnectedAt }: Props) {
  const router = useRouter()
  const [connected, setConnected] = useState(calendarConnected)
  const [disconnecting, setDisconnecting] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)

  const handleConnect = () => {
    window.location.href = '/api/calendar/connect'
  }

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Google Calendar? Scheduled events already in your calendar will remain, but new tasks won\'t sync.')) return
    setDisconnecting(true)
    setConnectError(null)
    try {
      const res = await fetch('/api/calendar/disconnect', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to disconnect')
      setConnected(false)
      router.refresh()
    } catch {
      setConnectError('Failed to disconnect. Please try again.')
    } finally {
      setDisconnecting(false)
    }
  }

  const connDate = calendarConnectedAt
    ? new Date(calendarConnectedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div style={{
      padding: '48px 40px',
      maxWidth: 640,
      fontFamily: "'Outfit', sans-serif",
    }}>
      {/* Page title */}
      <h1 style={{
        fontFamily: "'Fraunces', serif",
        fontSize: 32, fontWeight: 400, color: C.ink,
        marginBottom: 8, letterSpacing: -0.5,
      }}>
        Settings
      </h1>
      <p style={{ fontSize: 14, color: C.muted, marginBottom: 40 }}>
        Manage your account and integrations.
      </p>

      {/* Account section */}
      <Section title="Account">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(155,126,200,0.18), rgba(212,132,154,0.12))',
            border: '1.5px solid rgba(155,126,200,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700, color: C.accent, flexShrink: 0,
          }}>
            {userName?.[0]?.toUpperCase() || 'P'}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: C.ink, marginBottom: 2 }}>
              {userName || 'User'}
            </p>
            <p style={{ fontSize: 13, color: C.muted }}>{userEmail}</p>
          </div>
        </div>
      </Section>

      {/* Integrations section */}
      <Section title="Integrations">
        <div style={{ padding: '18px 20px' }}>
          {/* Google Calendar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            {/* Google icon */}
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'white',
              border: `1px solid ${C.cardBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: C.ink, marginBottom: 2 }}>
                Google Calendar
              </p>
              <p style={{ fontSize: 12, color: C.muted }}>
                {connected
                  ? `Connected${connDate ? ` since ${connDate}` : ''}`
                  : 'Sync your scheduled tasks to Google Calendar'}
              </p>
            </div>

            {connected ? (
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                style={{
                  background: 'rgba(212,114,122,0.08)',
                  border: '1px solid rgba(212,114,122,0.20)',
                  borderRadius: 10, padding: '8px 16px',
                  fontSize: 13, fontWeight: 600, color: C.urgent,
                  cursor: disconnecting ? 'wait' : 'pointer',
                  fontFamily: "'Outfit', sans-serif",
                  transition: 'all 0.2s',
                  opacity: disconnecting ? 0.6 : 1,
                  flexShrink: 0,
                }}
                onMouseEnter={e => {
                  if (!disconnecting) {
                    e.currentTarget.style.background = 'rgba(212,114,122,0.14)';
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(212,114,122,0.08)';
                }}
              >
                {disconnecting ? 'Disconnecting...' : 'Disconnect'}
              </button>
            ) : (
              <button
                onClick={handleConnect}
                style={{
                  background: C.accentDim,
                  border: `1px solid ${C.accentBorder}`,
                  borderRadius: 10, padding: '8px 16px',
                  fontSize: 13, fontWeight: 600, color: C.accent,
                  cursor: 'pointer',
                  fontFamily: "'Outfit', sans-serif",
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(155,126,200,0.16)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = C.accentDim;
                }}
              >
                Connect
              </button>
            )}
          </div>

          {connectError && (
            <p style={{ fontSize: 12, color: C.urgent, marginTop: 10, padding: '0 54px' }}>
              {connectError}
            </p>
          )}

          {connected && (
            <div style={{
              marginTop: 14, padding: '12px 16px', borderRadius: 10,
              background: 'rgba(91,173,122,0.06)',
              border: '1px solid rgba(91,173,122,0.15)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 13, color: C.green }}>●</span>
              <p style={{ fontSize: 12, color: C.soft, lineHeight: 1.5 }}>
                Tasks you schedule in Pulse will automatically appear in your Google Calendar.
                Existing events from Google Calendar are visible on your Pulse Calendar tab.
              </p>
            </div>
          )}
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <p style={{
        fontSize: 11, fontWeight: 700, color: '#9E958B',
        letterSpacing: 1, textTransform: 'uppercase',
        marginBottom: 10, padding: '0 4px',
      }}>
        {title}
      </p>
      <div style={{
        background: 'rgba(255,255,255,0.52)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(0,0,0,0.05)',
        borderRadius: 16,
        overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>
  )
}
