/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./blog/**/*.html", "./cotizaciones/*.html"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        serif: ["Playfair Display", "serif"],
      },
      colors: {
        navy: {
          900: "#001f3f",
          800: "#0a2f5e",
        },
        gold: {
          400: "#d4af37",
          500: "#c5a028",
          600: "#b08d1e",
        },
        electric: {
          400: "#4d8bff",
          500: "#1B4FFF",
          600: "#1540d6",
        },
      },
    },
  },
  plugins: [],
};
