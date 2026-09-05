/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        vault: {
          bg: "#0f1117",
          panel: "#171a23",
          border: "#262b38",
          accent: "#6366f1",
        },
      },
    },
  },
  plugins: [],
};
