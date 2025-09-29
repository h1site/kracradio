/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./public/index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#E50914',
          black: '#141414', // fond sombre demandé
        },
      },
    },
  },
  plugins: [],
};
