import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#0f1b33", dark: "#14264a", soft: "#1c3d8f" },
        teal: { DEFAULT: "#12b886", dark: "#0b8a62", soft: "#e6faf2" },
        amber: { DEFAULT: "#f59f00", soft: "#fff4d6" },
        red: { DEFAULT: "#e03131", soft: "#ffe3e3" },
        blue: { DEFAULT: "#1c7ed6", soft: "#e7f5ff" },
        purple: { DEFAULT: "#7048e8", soft: "#f0ebff" },
        ink: "#1f2937",
        muted: "#6b7280",
        line: "#e5e7eb",
        soft: "#f8fafc",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
