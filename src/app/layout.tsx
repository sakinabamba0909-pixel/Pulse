import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pulse — Your Lifestyle OS',
  description: 'Voice-first AI assistant for tasks, goals, relationships, and everything in between.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
