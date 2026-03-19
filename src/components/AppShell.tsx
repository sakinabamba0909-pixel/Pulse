'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import GanzfeldLight from './GanzfeldLight';
import { BloomContext } from '@/lib/BloomContext';

export { useBloom } from '@/lib/BloomContext';

function getMood(pathname: string): string {
  if (pathname === '/app') return 'home';
  if (pathname.startsWith('/app/tasks')) return 'tasks';
  if (pathname.startsWith('/app/goals')) return 'goals';
  if (pathname.startsWith('/app/relationships')) return 'people';
  if (pathname.startsWith('/app/reminders')) return 'reminders';
  if (pathname.startsWith('/app/projects')) return 'projects';
  return 'home';
}

interface AppShellProps {
  children: React.ReactNode;
  userName?: string;
  taskCount?: number;
  focusCount?: number;
}

export default function AppShell({ children, userName, taskCount = 0, focusCount = 0 }: AppShellProps) {
  const pathname = usePathname();
  const [scrollY, setScrollY] = useState(0);
  const [bloom, setBloom] = useState(0);
  const [showIntro, setShowIntro] = useState(false);
  const [appVisible, setAppVisible] = useState(true);

  const mood = getMood(pathname);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const seen = sessionStorage.getItem('pulse_intro_shown');
      if (!seen) {
        setShowIntro(true);
        setAppVisible(false);
        sessionStorage.setItem('pulse_intro_shown', '1');
      }
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const triggerBloom = useCallback(() => {
    setBloom(b => b + 1);
    setTimeout(() => setBloom(b => Math.max(0, b - 1)), 2000);
  }, []);

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
    setAppVisible(true);
  }, []);

  return (
    <BloomContext.Provider value={{ triggerBloom }}>
      <GanzfeldLight mood={showIntro ? 'intro' : mood} scrollY={scrollY} bloom={bloom} isIntro={showIntro} />
      {showIntro && (
        <IntroSplashInline
          userName={userName || ''}
          taskCount={taskCount}
          focusCount={focusCount}
          onComplete={handleIntroComplete}
        />
      )}
      <div style={{
        opacity: appVisible ? 1 : 0,
        transition: 'opacity 1.2s cubic-bezier(0.4,0,0.2,1)',
        position: 'relative',
        zIndex: 1,
      }}>
        {children}
      </div>
    </BloomContext.Provider>
  );
}

// Inline intro splash to avoid circular imports
function IntroSplashInline({
  userName,
  taskCount,
  focusCount,
  onComplete,
}: {
  userName: string;
  taskCount: number;
  focusCount: number;
  onComplete: () => void;
}) {
  const [phase, setPhase] = useState(0); // 0=breathing, 1=label, 2=greeting, 3=stats, 4=fadeout
  const [visible, setVisible] = useState(true);

  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const greeting = `Good ${timeOfDay}, ${userName}.`;

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 2200),
      setTimeout(() => setPhase(2), 2700),
      setTimeout(() => setPhase(3), 3500),
      setTimeout(() => setPhase(4), 5200),
      setTimeout(() => {
        setVisible(false);
        onComplete();
      }, 6400),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      pointerEvents: phase >= 4 ? 'none' : 'all',
      opacity: phase >= 4 ? 0 : 1,
      transition: 'opacity 1.2s cubic-bezier(0.4,0,0.2,1)',
    }}>
      {/* PULSE label */}
      <div style={{
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 1s ease, transform 1s ease',
        fontFamily: "'Fraunces', serif",
        fontSize: 15,
        fontWeight: 400,
        letterSpacing: 4,
        textTransform: 'uppercase',
        color: 'rgba(139,126,200,0.5)',
        marginBottom: 20,
      }}>
        PULSE
      </div>

      {/* Greeting */}
      <div style={{
        opacity: phase >= 2 ? 1 : 0,
        transform: phase >= 2 ? 'translateY(0)' : 'translateY(14px)',
        transition: 'opacity 1s ease, transform 1s ease',
        fontFamily: "'Fraunces', serif",
        fontSize: 44,
        fontWeight: 400,
        color: '#2A2D35',
        marginBottom: 16,
        textAlign: 'center',
      }}>
        {greeting}
      </div>

      {/* Stats */}
      <div style={{
        opacity: phase >= 3 ? 1 : 0,
        transform: phase >= 3 ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.9s ease, transform 0.9s ease',
        fontFamily: "'Outfit', sans-serif",
        fontSize: 16,
        color: '#8890A0',
      }}>
        {focusCount} task{focusCount !== 1 ? 's' : ''} in focus · {taskCount} total
      </div>
    </div>
  );
}
