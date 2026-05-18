'use client';

interface OrbProps {
  size?: number;
  animate?: boolean;
  float?: boolean;
}

export default function Orb({ size = 120, animate = true, float = false }: OrbProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        background:
          'radial-gradient(circle at 38% 35%, rgba(234,156,175,0.9) 0%, rgba(213,105,137,0.7) 50%, rgba(194,220,128,0.3) 100%)',
        boxShadow: `0 0 ${size * 0.7}px rgba(213,105,137,0.22)`,
        animation: float ? 'orbFloat 4s ease infinite' : 'none',
      }}
    />
  );
}
