import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        magic: {
          dark: 'var(--bg)',
          purple: 'var(--accent)',
          gold: 'var(--gold)',
          silver: '#c0c0c0',
          mystic: 'var(--muted)',
          success: 'var(--success)',
          error: 'var(--error)',
          warning: 'var(--warning)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
        cinzel: ['var(--font-cinzel)', 'serif'],
      },
      animation: {
        'toast-in': 'toast-slide-up 0.3s ease-out',
        'toast-out': 'toast-fade-out 0.3s ease-in forwards',
        'sparkle-burst': 'sparkle-burst 0.75s ease-out forwards',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        'toast-slide-up': {
          from: { transform: 'translateY(100%)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'toast-fade-out': {
          from: { opacity: '1' },
          to: { opacity: '0', transform: 'translateY(-10px)' },
        },
        'sparkle-burst': {
          '0%': { transform: 'scale(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(180deg)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
