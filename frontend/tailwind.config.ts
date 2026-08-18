import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#08080d",
        surface: "#101018",
        "surface-raised": "#171723",
        "surface-card": "rgba(255, 255, 255, 0.03)",
        border: "rgba(255, 255, 255, 0.08)",
        "border-glow": "rgba(139, 92, 246, 0.3)",
        primary: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
        accent: {
          cyan: "#06b6d4",
          violet: "#8b5cf6",
          fuchsia: "#d946ef",
          amber: "#f59e0b",
          emerald: "#10b981",
        }
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-glow": "radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.15) 0%, transparent 70%)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-spin": "spin 8s linear infinite",
      }
    },
  },
  plugins: [],
};

export default config;
