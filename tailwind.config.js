/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "sea-green": "#5FC193",
      },
    },
    fontFamily: {
      quicksand: ["Quicksand Variable"],
    },
  },
  plugins: [],
};
