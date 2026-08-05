import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1c1c1e",
        paper: "#fafaf9",
        line: "#e4e4e7",
        brand: {
          DEFAULT: "#48297A",
          dark: "#3a2063",
          light: "#5f3a99",
        },
        accent: "#B31E7D",
        status: {
          planned: "#6b7280",
          progress: "#B45309",
          ready: "#2563EB",
          posted: "#15803D",
          archived: "#9CA3AF",
          atrisk: "#DC2626",
        },
      },
    },
  },
  plugins: [],
};
export default config;
