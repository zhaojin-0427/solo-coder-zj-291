/** @type {import('tailwindcss').Config} */

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
    },
    extend: {
      fontFamily: {
        display: ['Pacifico', 'cursive'],
        body: ['Nunito', 'sans-serif'],
      },
      colors: {
        cream: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
        },
        cake: {
          pink: '#FFB6C1',
          chocolate: '#8B4513',
          strawberry: '#FF69B4',
        },
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
