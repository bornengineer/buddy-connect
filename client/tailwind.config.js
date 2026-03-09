/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        canvas: "#f8fafc",
        brand: "#0ea5e9",
        accent: "#14b8a6",
      },
    },
  },
  plugins: [],
};
