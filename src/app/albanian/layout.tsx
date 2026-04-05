import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mëso Shqip — Kosovo Albanian Immersion',
  description: 'Learn Kosovo Gheg Albanian through comprehensible input and immersive storytelling.',
};

export default function AlbanianLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="dark" className="min-h-screen bg-[#0a0a0a]">
      {children}
    </div>
  );
}
