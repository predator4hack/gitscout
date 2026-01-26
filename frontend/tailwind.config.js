/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gs-body': '#030303',
        'gs-card': '#0a0a0a',
        'gs-section-alt': '#050505',
        'gs-text-main': '#ededed',
        'gs-text-muted': '#888888',
        'gs-text-dim': '#666666',
        'gs-text-darker': '#444444',
        // Accent colors
        'gs-purple': '#D591FE',
        'gs-blue': '#3B82F6',
        'gs-yellow': '#EAB308',
        'gs-cyan': '#00FFD1',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'sweep': 'sweep 0.3s ease-in-out',
      },
      keyframes: {
        sweep: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
