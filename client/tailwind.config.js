export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        brand: {
          50: '#fffceb',
          100: '#fff4c2',
          200: '#ffe985',
          300: '#ffdb47',
          400: '#ffc400',
          500: '#eba800',
          600: '#c48200',
          700: '#9c5f02',
          800: '#7f4b09',
          900: '#6b3f0e',
          950: '#3f2103',
        },
        paper: '#f7f5ef',
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(0.5rem)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.85)', opacity: '0.7' },
          '70%': { transform: 'scale(1.6)', opacity: '0' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
      },
      animation: {
        rise: 'rise 260ms cubic-bezier(0.22, 1, 0.36, 1) both',
        ring: 'pulseRing 1900ms ease-out infinite',
      },
    },
  },
  plugins: [],
}