import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          cs2: {
            orange: '#FF6B35',
            blue: '#004E89',
            accent: '#F77F00',
            success: '#06FFA5',
            warning: '#FFD23F',
            error: '#EF476F',
            dark: '#0A0E27',
            card: '#1A1F3A',
          }
        },
        animation: {
          'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          'slide-up': 'slideUp 0.5s ease-out',
          'fade-in': 'fadeIn 0.3s ease-in',
        },
        keyframes: {
          slideUp: {
            '0%': { transform: 'translateY(20px)', opacity: 0 },
            '100%': { transform: 'translateY(0)', opacity: 1 },
          },
          fadeIn: {
            '0%': { opacity: 0 },
            '100%': { opacity: 1 },
          }
        }
      },
    },
    plugins: [daisyui],
    daisyui: {
      themes: [
        {
          cs2dark: {
            "primary": "#FF6B35",
            "secondary": "#004E89",
            "accent": "#F77F00",
            "neutral": "#1A1F3A",
            "base-100": "#0A0E27",
            "base-200": "#1A1F3A",
            "base-300": "#2A2F4A",
            "info": "#00D9FF",
            "success": "#06FFA5",
            "warning": "#FFD23F",
            "error": "#EF476F",
          },
        },
      ],
    },
  }