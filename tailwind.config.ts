import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1a3c27",
          dark: "#0f2618",
          light: "#2d5a3f",
        },
        secondary: {
          DEFAULT: "#c17f59",
          dark: "#9a6344",
        },
        background: {
          DEFAULT: "#f5f1e8",
          light: "#ffffff",
          border: "#e8e0d0",
        },
        text: {
          DEFAULT: "#2d2d2d",
          light: "#6b6b6b",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)"],
        mono: ["var(--font-geist-mono)"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
