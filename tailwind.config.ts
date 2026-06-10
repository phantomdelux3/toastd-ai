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
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        "input-glow": "0 0 0 1px rgba(255,255,255,0.08), 0 8px 40px -8px rgba(244, 63, 94, 0.25)",
        "input-glow-focus": "0 0 0 1px rgba(255,255,255,0.25), 0 8px 60px -8px rgba(244, 63, 94, 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
