/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        maroon: {
          50: '#fbf3f4',
          100: '#f7e6e8',
          200: '#eec3c8',
          300: '#e09aa3',
          400: '#cc6b7a',
          500: '#b9465a',
          600: '#9d2f44',
          700: '#7a1f2b',
          800: '#5e1822',
          900: '#4a141c',
          950: '#2c0a10',
        },
        cream: {
          50: '#fffdf8',
          100: '#fdf9ee',
          200: '#faf0d6',
          300: '#f4e3b8',
          400: '#ecd09a',
          500: '#ddb874',
        },
        gold: {
          50: '#fdfbf3',
          100: '#faf3d7',
          200: '#f5e9ad',
          300: '#ecd36f',
          400: '#e3bd3e',
          500: '#d4a521',
          600: '#b8841a',
          700: '#946518',
          800: '#7a521a',
          900: '#66441b',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        urdu: ['Noto Nastaliq Urdu', 'serif'],
      },
      boxShadow: {
        soft: '0 2px 12px -2px rgba(122, 31, 43, 0.1)',
        card: '0 8px 30px -12px rgba(122, 31, 43, 0.18)',
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out',
        scaleIn: 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
