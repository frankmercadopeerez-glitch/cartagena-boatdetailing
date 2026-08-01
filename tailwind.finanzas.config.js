/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./finanzas.html"],
  theme: {
    extend: {
      colors: {
        navy: { 900: "#071428", 800: "#0f172a", 700: "#1e293b" },
        gold: { 500: "#B8904D" },
      },
      fontFamily: { sans: ["Poppins", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
