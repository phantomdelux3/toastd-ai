import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkbg: "#0a0a0a",
        "ds-text-primary": "#0a0a0a",
        "ds-text-secondary": "#525252",
        "ds-text-quaternary": "#737373",
        "ds-border-primary": "rgba(0,0,0,0.08)",
        "info-500": "#3b82f6",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
        display: ["Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
