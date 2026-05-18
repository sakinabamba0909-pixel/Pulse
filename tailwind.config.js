/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        pulse: {
          accent: '#8B7EC8',
          'accent-soft': 'rgba(139,126,200,0.10)',
          'accent-mid': 'rgba(139,126,200,0.18)',
          rose: '#C8889E',
          peach: '#C8A088',
          sky: '#7AABC8',
          sage: '#7EB89B',
          ink: '#2A2D35',
          muted: '#8890A0',
          faint: '#B0B6C4',
          bg: '#C5CDDA',
          surface: 'rgba(255,255,255,0.55)',
          border: 'rgba(255,255,255,0.25)',
        },
      },
      fontFamily: {
        serif: ['Fraunces', 'serif'],
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
