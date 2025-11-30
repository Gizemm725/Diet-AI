/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#7C3AED',
        secondary: '#3B82F6', 
        accent: '#EC4899',
        neon: '#39FF14',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { 
            transform: 'translateY(50px)',
            opacity: '0' 
          },
          '100%': { 
            transform: 'translateY(0)',
            opacity: '1' 
          },
        },
        'neon-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 8px rgba(57,255,20,0.6), 0 0 16px rgba(57,255,20,0.4), 0 0 24px rgba(57,255,20,0.2)'
          },
          '50%': {
            boxShadow: '0 0 14px rgba(57,255,20,0.9), 0 0 28px rgba(57,255,20,0.6), 0 0 42px rgba(57,255,20,0.3)'
          }
        }
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-in-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'neon-pulse': 'neon-pulse 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}