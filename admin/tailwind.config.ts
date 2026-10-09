import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2563EB',
          primary: '#2563EB',
          dark: '#1E3A8A',
          gold: '#EAB308',
          ink: '#0F172A',
          bg: '#F1F5F9',
          muted: '#64748B',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(20,33,47,0.04), 0 8px 24px -16px rgba(20,33,47,0.25)',
        card: '0 1px 3px rgba(20,33,47,0.06), 0 14px 32px -20px rgba(20,33,47,0.30)',
      },
    },
  },
  plugins: [],
};

export default config;
