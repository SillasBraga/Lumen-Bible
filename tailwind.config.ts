import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        canvas: 'rgb(var(--canvas) / <alpha-value>)',
        panel: 'rgb(var(--panel) / <alpha-value>)',
        soft: 'rgb(var(--soft) / <alpha-value>)',
        text: 'rgb(var(--text) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        accent2: 'rgb(var(--accent2) / <alpha-value>)',
      },
      boxShadow: {
        glow: '0 24px 80px rgba(15, 23, 42, 0.18)',
      },
      fontFamily: {
        display: ['Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', 'serif'],
        body: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        ui: ['Segoe UI', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        veil:
          'radial-gradient(circle at top, rgba(199, 210, 254, 0.22), transparent 36%), radial-gradient(circle at 85% 10%, rgba(251, 191, 36, 0.14), transparent 26%), linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.72))',
        veilDark:
          'radial-gradient(circle at top, rgba(56, 189, 248, 0.14), transparent 34%), radial-gradient(circle at 85% 10%, rgba(250, 204, 21, 0.08), transparent 24%), linear-gradient(180deg, rgba(12,17,27,0.92), rgba(9,12,20,0.9))',
      },
    },
  },
  plugins: [],
} satisfies Config;
