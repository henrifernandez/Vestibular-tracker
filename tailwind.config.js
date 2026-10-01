/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tema escuro: "ink" agora e o tom claro do texto e "paper" o fundo.
        ink: "#E8EEEB",
        paper: "#0D1211",
        surface: "#151C1A",
        accent: "#2F7F73",
        brand: "#6CC4B6",
        warn: "#D0822F",
        good: "#3FA46C",
        risco: "#E0554B",
        atencao: "#D3A22A",
        brilhante: "#34D27B",
        bio: "#4A9466",
        qui: "#3D86AD",
        fis: "#8A6FD0",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
