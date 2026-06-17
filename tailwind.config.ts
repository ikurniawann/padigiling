import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff5f4',
          100: '#ffecea',
          200: '#ffcfc9',
          300: '#ffa89e',
          400: '#ff7b6e',
          500: '#f05040',
          DEFAULT: '#e8382a',
          600: '#d42a1e',
          700: '#b82018',
          800: '#991a15',
          900: '#7f1713',
          dark: '#b82018',
          soft: 'rgba(232,56,42,0.08)',
        },
        warm: {
          50: '#fdfaf7',
          100: '#faf3eb',
          200: '#f5e6d5',
          300: '#edd4b5',
          400: '#e4bd91',
          500: '#d4a373',
          600: '#c08a5c',
          700: '#a06f48',
          800: '#83593b',
          900: '#6b4832',
        },
      },
      boxShadow: {
        glass: '0 4px 24px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.7)',
        'glass-hover': '0 8px 32px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)',
        'brand-glow': '0 2px 12px rgba(232,56,42,0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
      },
      borderRadius: {
        glass: '1.25rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease',
      },
    },
  },
  plugins: [],
}

export default config
