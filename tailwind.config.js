
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
  ],
  safelist: [
    {
      pattern: /bg-(red|rose|pink|fuchsia|purple|violet|indigo|blue|sky|cyan|teal|emerald|green|lime|yellow|amber|orange|gray|slate|zinc|neutral|stone)-(100|200)/,
    },
    {
      pattern: /border-(red|rose|pink|fuchsia|purple|violet|indigo|blue|sky|cyan|teal|emerald|green|lime|yellow|amber|orange|gray|slate|zinc|neutral|stone)-(100|200|300|400|500)/,
    }
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        emoji: ['"Noto Color Emoji"', 'sans-serif'],
        stencil: ['"Allerta Stencil"', 'sans-serif'],
        glitch: ['"Rubik Glitch"', 'system-ui'],
      },
      animation: {
        'blob': 'blob 7s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient-x': 'gradient-x 15s ease infinite',
        'enter-card': 'enter-card 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'exit-card': 'exit-card 1s cubic-bezier(0.7, 0, 0.84, 0) forwards',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        'enter-card': {
          '0%': { opacity: '0', transform: 'translateY(40px) scale(0.92)', filter: 'blur(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)', filter: 'blur(0)' },
        },
        'exit-card': {
          '0%': { opacity: '1', transform: 'scale(1)', filter: 'blur(0)' },
          '100%': { opacity: '0', transform: 'scale(0.8) translateY(-20px)', filter: 'blur(12px)' },
        }
      }
    },
  },
  plugins: [],
};
