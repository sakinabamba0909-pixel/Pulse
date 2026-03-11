'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Orb from '@/components/Orb';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage('Check your email for a confirmation link!');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        router.push('/');
        router.refresh();
      }
    }
    setLoading(false);
  };

  const handleGoogleAuth = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#FAFAF9', padding: 24, fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 400, animation: 'fadeIn 0.6s ease' }}>
        {/* Logo + Orb */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <Orb size={80} />
          </div>
          <h1 style={{
            fontFamily: "'Instrument Serif', serif", fontSize: 36,
            fontWeight: 400, letterSpacing: -0.5, color: '#1A1A1A', marginBottom: 8,
          }}>
            Pulse
          </h1>
          <p style={{ fontSize: 15, color: '#6B6B6B', lineHeight: 1.5 }}>
            {isSignUp ? 'Create your account to get started' : 'Welcome back'}
          </p>
        </div>

        {/* Google Sign In */}
        <button onClick={handleGoogleAuth} style={{
          width: '100%', padding: '14px 20px', borderRadius: 14,
          background: '#FFFFFF', border: '1.5px solid #E8E6E3',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          fontSize: 14, fontWeight: 500, color: '#1A1A1A', cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif", marginBottom: 20,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          transition: 'all 0.15s',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20,
        }}>
          <div style={{ flex: 1, height: 1, background: '#E8E6E3' }} />
          <span style={{ fontSize: 12, color: '#9B9B9B', fontWeight: 500 }}>or</span>
          <div style={{ flex: 1, height: 1, background: '#E8E6E3' }} />
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailAuth}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6B6B6B', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required
              style={{
                width: '100%', padding: '13px 16px', borderRadius: 12,
                border: '1.5px solid #E8E6E3', background: '#FFFFFF',
                fontSize: 14, color: '#1A1A1A', fontFamily: "'DM Sans', sans-serif",
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#2DB87A'}
              onBlur={e => e.target.style.borderColor = '#E8E6E3'}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6B6B6B', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder={isSignUp ? 'Create a password (min 6 chars)' : 'Your password'}
              required minLength={6}
              style={{
                width: '100%', padding: '13px 16px', borderRadius: 12,
                border: '1.5px solid #E8E6E3', background: '#FFFFFF',
                fontSize: 14, color: '#1A1A1A', fontFamily: "'DM Sans', sans-serif",
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#2DB87A'}
              onBlur={e => e.target.style.borderColor = '#E8E6E3'}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 10, marginBottom: 16,
              background: 'rgba(239,107,107,0.08)', border: '1px solid rgba(239,107,107,0.2)',
            }}>
              <p style={{ fontSize: 13, color: '#EF6B6B' }}>{error}</p>
            </div>
          )}

          {message && (
            <div style={{
              padding: '10px 14px', borderRadius: 10, marginBottom: 16,
              background: 'rgba(45,184,122,0.08)', border: '1px solid rgba(45,184,122,0.2)',
            }}>
              <p style={{ fontSize: 13, color: '#2DB87A' }}>{message}</p>
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '14px 20px', borderRadius: 14,
            background: loading ? '#E8E6E3' : '#2DB87A',
            border: 'none', color: loading ? '#9B9B9B' : 'white',
            fontSize: 15, fontWeight: 600, cursor: loading ? 'default' : 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: loading ? 'none' : '0 4px 16px rgba(45,184,122,0.25)',
            transition: 'all 0.2s',
          }}>
            {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {/* Toggle sign up / sign in */}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#6B6B6B' }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }}
            style={{
              background: 'none', border: 'none', color: '#2DB87A',
              fontWeight: 600, cursor: 'pointer', fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  );
}
