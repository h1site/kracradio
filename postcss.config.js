/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#E50914",
          black: "#0B0B0B",
          white: "#FFFFFF"
        }
      },
      boxShadow: {
        card: "0 10px 20px rgba(0,0,0,0.15)"
      }
    }
  },
  plugins: []
}
