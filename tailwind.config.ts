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
        'neon-green': '#00FF41',
        'neon-cyan': '#00FFFF',
        'neon-blue': '#0080FF',
        'neon-purple': '#8000FF',
        'neon-red': '#FF2020',
        'neon-amber': '#FFBB00',
        'bg-dark': '#050A0E',
        'bg-card': '#0D1117',
        'bg-terminal': '#080D10',
        'cyber-border': '#00FF4140',
      },
      fontFamily: {
        mono: ['Courier New', 'Courier', 'monospace'],
        cyber: ['Share Tech Mono', 'Courier New', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'typing': 'typing 3.5s steps(40,end)',
        'blink': 'blink 1s step-end infinite',
        'scanline': 'scanline 8s linear infinite',
        'flicker': 'flicker 0.15s infinite',
        'float': 'float 6s ease-in-out infinite',
        'glitch': 'glitch 0.3s ease-in-out',
        'neon-flicker': 'neonFlicker 2s infinite',
        'spin-slow': 'spin 20s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%,100%': { boxShadow: '0 0 5px #00FF41, 0 0 10px #00FF41, 0 0 20px #00FF41' },
          '50%': { boxShadow: '0 0 10px #00FF41, 0 0 25px #00FF41, 0 0 50px #00FF41' },
        },
        blink: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0' } },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        flicker: {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
          '25%,75%': { opacity: '0.95' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glitch: {
          '0%,100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(2px, -2px)' },
          '60%': { transform: 'translate(-1px, 1px)' },
          '80%': { transform: 'translate(1px, -1px)' },
        },
        neonFlicker: {
          '0%,19%,21%,23%,25%,54%,56%,100%': { opacity: '1' },
          '20%,24%,55%': { opacity: '0.4' },
        },
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        'neon-green': '0 0 5px #00FF41, 0 0 20px #00FF4150',
        'neon-cyan': '0 0 5px #00FFFF, 0 0 20px #00FFFF50',
        'neon-blue': '0 0 5px #0080FF, 0 0 20px #0080FF50',
        'neon-purple': '0 0 5px #8000FF, 0 0 20px #8000FF50',
        'neon-red': '0 0 5px #FF2020, 0 0 20px #FF202050',
        'glow-sm': '0 0 10px currentColor',
        'glow-md': '0 0 20px currentColor, 0 0 40px currentColor',
        'glow-lg': '0 0 30px currentColor, 0 0 60px currentColor, 0 0 90px currentColor',
        'card-cyber': 'inset 0 1px 0 0 #00FF4120, 0 0 0 1px #00FF4130',
      },
    },
  },
  plugins: [],
};

export default config;
