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
        // Builder-specific tokens (keep for panel/code coloring)
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
        'fade-in':   'fadeIn 0.18s ease-out forwards',
        'slide-up':  'slideUp 0.28s cubic-bezier(0.16,1,0.3,1) forwards',
        'spin-slow': 'spin 1.4s linear infinite',
        'reveal':    'reveal 0.35s cubic-bezier(0.16,1,0.3,1) forwards',
        'scale-in':  'scaleIn 0.25s cubic-bezier(0.16,1,0.3,1) forwards',
        'slide-in-up':'slideInUp 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity:'0' },                                    '100%': { opacity:'1' } },
        slideUp:   { '0%': { opacity:'0', transform:'translateY(6px)' },       '100%': { opacity:'1', transform:'translateY(0)' } },
        reveal:    { '0%': { opacity:'0', transform:'translateY(6px)' },       '100%': { opacity:'1', transform:'translateY(0)' } },
        scaleIn:   { '0%': { opacity:'0', transform:'scale(0.96)' },           '100%': { opacity:'1', transform:'scale(1)' } },
        slideInUp: { '0%': { opacity:'0', transform:'translateY(12px)' },      '100%': { opacity:'1', transform:'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
