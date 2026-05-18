import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mëso Shqip — Kosovo Albanian Immersion',
  description: 'Learn Kosovo Gheg Albanian through comprehensible input and immersive storytelling.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div data-theme="dark" className="min-h-screen bg-[#0a0a0a]">
          {children}
        </div>
      </body>
    </html>
  );
}
