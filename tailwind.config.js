const brandGold = "#d4af37";

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./blog/**/*.html",
    "./cotizaciones/*.html",
    "./contratos/*.html",
  ],
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
          300: brandGold,
          400: brandGold,
          500: brandGold,
          600: brandGold,
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
