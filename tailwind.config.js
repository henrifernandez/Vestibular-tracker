/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#161616",
        paper: "#faf9f6",
        accent: "#2f6f4f",
        warn: "#b1502e",
      },
    },
  },
  plugins: [],
};
