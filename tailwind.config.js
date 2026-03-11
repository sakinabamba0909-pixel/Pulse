/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        briefly: {
          green: '#2DB87A',
          'green-soft': 'rgba(45,184,122,0.08)',
          'green-mid': 'rgba(45,184,122,0.15)',
          dark: '#0B0E11',
          surface: '#13171C',
          card: '#171C22',
          border: '#232A33',
        },
      },
      fontFamily: {
        serif: ['Instrument Serif', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
