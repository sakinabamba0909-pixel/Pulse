/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        pulse: {
          accent: '#9B7EC8',
          'accent-soft': 'rgba(155,126,200,0.10)',
          'accent-mid': 'rgba(155,126,200,0.18)',
          rose: '#D4849A',
          peach: '#D4A47A',
          sky: '#7AABC8',
          sage: '#7EB89B',
          ink: '#2D2A26',
          muted: '#9E958B',
          faint: '#C9C1B8',
          bg: '#F0EBE6',
          surface: 'rgba(255,255,255,0.52)',
          border: 'rgba(0,0,0,0.05)',
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
