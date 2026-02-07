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
        // Modern slate/emerald palette matching sidebar
        primary: {
          DEFAULT: "#0f172a",  // Slate 900
          dark: "#020617",     // Slate 950
          light: "#1e293b",    // Slate 800
        },
        secondary: {
          DEFAULT: "#10b981",  // Emerald 500
          dark: "#059669",     // Emerald 600
          light: "#34d399",    // Emerald 400
        },
        accent: {
          DEFAULT: "#14b8a6",  // Teal 500
          light: "#2dd4bf",    // Teal 400
        },
        background: {
          DEFAULT: "#f8fafc",  // Slate 50
          light: "#ffffff",    // White
          dark: "#f1f5f9",     // Slate 100
          border: "#e2e8f0",   // Slate 200
        },
        text: {
          DEFAULT: "#0f172a",  // Slate 900
          secondary: "#475569", // Slate 600
          muted: "#94a3b8",    // Slate 400
        },
        // Status colors
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
        info: "#3b82f6",
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Typography scale per design skill (body 15-18px)
        xs: ["0.75rem", { lineHeight: "1.5" }],      // 12px
        sm: ["0.8125rem", { lineHeight: "1.5" }],   // 13px
        base: ["0.9375rem", { lineHeight: "1.6" }], // 15px
        lg: ["1.0625rem", { lineHeight: "1.55" }],  // 17px
        xl: ["1.25rem", { lineHeight: "1.4" }],     // 20px
        "2xl": ["1.5rem", { lineHeight: "1.3" }],   // 24px
        "3xl": ["1.875rem", { lineHeight: "1.25" }], // 30px
        "4xl": ["2.25rem", { lineHeight: "1.2" }],  // 36px
      },
      spacing: {
        // 8px base unit
        "18": "4.5rem",
        "88": "22rem",
      },
      borderRadius: {
        "xl": "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        "soft": "0 2px 8px -2px rgba(0, 0, 0, 0.05), 0 4px 16px -4px rgba(0, 0, 0, 0.1)",
        "medium": "0 4px 12px -2px rgba(0, 0, 0, 0.08), 0 8px 24px -4px rgba(0, 0, 0, 0.12)",
        "card": "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-in": "slideIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      transitionDuration: {
        "250": "250ms",
        "350": "350ms",
      },
      transitionTimingFunction: {
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
