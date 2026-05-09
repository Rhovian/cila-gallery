/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Warm cream palette — see styles.css for design rationale
        cream: {
          50: '#faf8f4',
          100: '#f5e6c8',
          200: '#e8dfd0',
          300: '#d4c8b0'
        },
        ink: {
          900: '#1a1815',
          800: '#2a2622',
          700: '#3a342c',
          600: '#5a544c',
          500: '#8a7f72'
        },
        gallery: {
          wall: '#f5f0e6',
          floor: '#2a2622',
          deep: '#1a1815',
          deeper: '#0a0908'
        }
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      letterSpacing: {
        widest: '0.2em',
        wider: '0.15em'
      }
    }
  },
  plugins: []
};
