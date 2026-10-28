/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Modern Material Design 3 inspired solid palette (strictly NO AI slop gradients)
        surface: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },
        md: {
          primary: '#1D4ED8',       // Crisp solid primary blue (Material 3 style)
          primaryHover: '#1E40AF',
          primaryLight: '#EFF6FF',
          secondary: '#475569',
          outline: '#CBD5E1',
          outlineFocus: '#1D4ED8',
          success: '#15803D',
          successLight: '#F0FDF4',
          warning: '#B45309',
          warningLight: '#FFFBEB',
          danger: '#B91C1C',
          dangerLight: '#FEF2F2',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'm-1': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'm-2': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'm-3': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'm-4': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
};
