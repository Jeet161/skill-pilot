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
        background: "#05070d",
        surface: "#0b0f19",
        surface2: "#101627",
        border: "rgba(255,255,255,0.08)",
        primary: {
          DEFAULT: "#6ee7ff",
          dim: "#3fb9d6",
        },
        accent: {
          violet: "#a78bfa",
          amber: "#fbbf6e",
          rose: "#fb7185",
          emerald: "#34d399",
        },
        muted: "#8b93a7",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "grid-fade": "radial-gradient(circle at 50% 0%, rgba(110,231,255,0.08), transparent 60%)",
      },
      keyframes: {
        pulseSlow: { "0%,100%": { opacity: "0.5" }, "50%": { opacity: "1" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
      },
      animation: {
        pulseSlow: "pulseSlow 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
