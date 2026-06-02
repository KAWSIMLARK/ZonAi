import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cool monochrome base (volontairement non-warm)
        canvas: "#F4F4F2",
        surface: "#FFFFFF",
        ink: {
          DEFAULT: "#0E1116",
          soft: "#2B3038",
          mute: "#5E646C",
          faint: "#9CA0A6",
        },
        line: "#E2E2DF",
        "line-strong": "#CECECA",
        // Accent unique saturé : emerald deep (sortie de warm-craft)
        accent: {
          DEFAULT: "#0A6E4F",
          deep: "#054C36",
          soft: "#138B66",
          wash: "#E2F1EB",
        },
        warn: {
          DEFAULT: "#A86B0D",
          wash: "#FBF1DC",
        },
        danger: {
          DEFAULT: "#A4292C",
          wash: "#F6E1E2",
        },
        ok: {
          DEFAULT: "#1F7A4C",
          wash: "#E2F1EB",
        },
        info: {
          DEFAULT: "#1F5A8A",
          wash: "#E5EDF3",
        },
      },
      fontFamily: {
        sans: ['"Geist"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"Geist Mono"', "ui-monospace", "monospace"],
      },
      fontSize: {
        "display-1": ["4rem", { lineHeight: "1.04", letterSpacing: "-0.025em" }],
        "display-2": ["2.75rem", { lineHeight: "1.08", letterSpacing: "-0.02em" }],
        h1: ["1.875rem", { lineHeight: "1.15", letterSpacing: "-0.015em" }],
        h2: ["1.375rem", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
      },
      boxShadow: {
        card: "0 1px 2px rgba(14,17,22,0.04)",
        "card-hover": "0 2px 8px rgba(14,17,22,0.07)",
      },
      borderRadius: {
        xl2: "1.125rem",
      },
      transitionTimingFunction: {
        editorial: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
