'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [identities, setIdentities] = useState<string[]>([]);
  const [linking, setLinking] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setEmail(user.email || '');
      const providers = (user.identities || []).map((i: any) => i.provider);
      setIdentities(providers);
    });
  }, []);

  const handleLinkGoogle = async () => {
    setLinking(true);
    setMessage('');
    const { error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setMessage(error.message);
      setLinking(false);
    }
    // on success, Supabase redirects to Google — no need to setLinking(false)
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push('/login');
  };

  const C = {
    bg: '#F5F4F2', card: '#FFFFFF', border: 'rgba(0,0,0,0.07)',
    text: '#1A1A1A', muted: '#8A949E', divider: 'rgba(0,0,0,0.06)',
    accent: '#2DB87A', accentDim: 'rgba(45,184,122,0.09)',
    accentBorder: 'rgba(45,184,122,0.22)', danger: '#EF4444',
    dangerDim: 'rgba(239,68,68,0.07)', dangerBorder: 'rgba(239,68,68,0.2)',
  };

  const hasGoogle = identities.includes('google');

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'DM Sans', sans-serif" }}>
      <div className="page-shell" style={{ maxWidth: 560, margin: '0 auto', padding: '56px 24px 100px' }}>

        <h1 style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: 32, fontWeight: 400, letterSpacing: -0.5,
          color: C.text, marginBottom: 8,
        }}>
          Settings
        </h1>
        <p style={{ fontSize: 14, color: C.muted, marginBottom: 36 }}>
          Manage your account and connections.
        </p>

        {/* Account card */}
        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 20, overflow: 'hidden', marginBottom: 16,
        }}>
          <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.divider}` }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 1, textTransform: 'uppercase' }}>
              Account
            </p>
          </div>

          {/* Email row */}
          <div style={{
            padding: '16px 22px', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', borderBottom: `1px solid ${C.divider}`,
          }}>
            <div>
              <p style={{ fontSize: 12, color: C.muted, marginBottom: 2 }}>Email</p>
              <p style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{email || '—'}</p>
            </div>
            <div style={{
              padding: '4px 10px', borderRadius: 20,
              background: C.accentDim, border: `1px solid ${C.accentBorder}`,
            }}>
              <span style={{ fontSize: 11, color: C.accent, fontWeight: 600 }}>email / password</span>
            </div>
          </div>

          {/* Google linking row */}
          <div style={{ padding: '16px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 14, color: C.text, fontWeight: 500, marginBottom: 2 }}>Google Sign-In</p>
              <p style={{ fontSize: 12, color: C.muted }}>
                {hasGoogle ? 'Google is linked to this account.' : 'Link Google to sign in with one tap.'}
              </p>
            </div>
            {hasGoogle ? (
              <div style={{
                padding: '4px 10px', borderRadius: 20,
                background: C.accentDim, border: `1px solid ${C.accentBorder}`,
              }}>
                <span style={{ fontSize: 11, color: C.accent, fontWeight: 600 }}>✓ Linked</span>
              </div>
            ) : (
              <button
                onClick={handleLinkGoogle}
                disabled={linking}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 16px', borderRadius: 12,
                  background: linking ? '#F0F0EE' : C.card,
                  border: `1.5px solid ${linking ? C.border : '#DADADA'}`,
                  fontSize: 13, fontWeight: 500, color: linking ? C.muted : C.text,
                  cursor: linking ? 'default' : 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {!linking && (
                  <svg width="15" height="15" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                {linking ? 'Redirecting…' : 'Link Google'}
              </button>
            )}
          </div>
        </div>

        {message && (
          <div style={{
            padding: '10px 16px', borderRadius: 12, marginBottom: 16,
            background: C.dangerDim, border: `1px solid ${C.dangerBorder}`,
          }}>
            <p style={{ fontSize: 13, color: C.danger }}>{message}</p>
          </div>
        )}

        {/* Sign out */}
        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 20, overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 14, color: C.text, fontWeight: 500, marginBottom: 2 }}>Sign out</p>
              <p style={{ fontSize: 12, color: C.muted }}>Sign out of your Pulse account.</p>
            </div>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              style={{
                padding: '9px 16px', borderRadius: 12,
                background: C.dangerDim, border: `1px solid ${C.dangerBorder}`,
                fontSize: 13, fontWeight: 500, color: C.danger,
                cursor: signingOut ? 'default' : 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                transition: 'all 0.15s',
              }}
            >
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
