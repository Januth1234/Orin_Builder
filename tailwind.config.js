/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html','./index.tsx','./App.tsx','./components/**/*.tsx','./services/**/*.ts','./types.ts'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans','Noto Sans Sinhala','Noto Sans Tamil','sans-serif'],
        mono: ['JetBrains Mono','Fira Code','ui-monospace','monospace'],
      },
      colors: {
        b: {
          bg:      '#0c0d11',
          surf:    '#13141b',
          elev:    '#1a1b24',
          border:  '#1f2130',
          accent:  '#22c892',
          'accent-dim': '#166d50',
          blue:    '#4d9fff',
          purple:  '#b47edc',
          muted:   '#686b7e',
          dim:     '#45475a',
        },
      },
      animation: {
        'fade-in':    'fadeIn 0.18s ease-out forwards',
        'slide-up':   'slideUp 0.28s cubic-bezier(0.16,1,0.3,1) forwards',
        'spin-slow':  'spin 1.4s linear infinite',
        'blink':      'blink 1s step-end infinite',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity:'0' }, '100%': { opacity:'1' } },
        slideUp: { '0%': { opacity:'0', transform:'translateY(6px)' }, '100%': { opacity:'1', transform:'translateY(0)' } },
        blink:   { '0%,100%': { opacity:'1' }, '50%': { opacity:'0' } },
      },
    },
  },
  plugins: [],
};
