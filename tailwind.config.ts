import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#161a3e",
        brand: { DEFAULT: "#6d5df6", light: "#9b8cff", dark: "#5546d6" },
        sun: "#ffb23e",
        mint: "#2bd4a8",
        coral: "#ff6b6b",
      },
      fontFamily: {
        sans: ['"Nunito Variable"', "ui-sans-serif", "system-ui", "sans-serif"],
        display: ['"Fredoka Variable"', "ui-rounded", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 20px 45px -22px rgba(22,26,62,0.35)",
        pop: "0 12px 30px -8px rgba(109,93,246,0.5)",
      },
      borderRadius: {
        xl2: "1.5rem",
        xl3: "2rem",
      },
      keyframes: {
        pop: {
          "0%": { transform: "scale(0.7)", opacity: "0" },
          "60%": { transform: "scale(1.06)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        float: {
          "0%,100%": { transform: "translateY(0) translateX(0) scale(1)" },
          "33%": { transform: "translateY(-24px) translateX(16px) scale(1.06)" },
          "66%": { transform: "translateY(14px) translateX(-18px) scale(0.97)" },
        },
        shimmer: {
          // The shine is 1/3 of the bar wide; travel from fully off the left
          // (-100%) to fully off the right (300%) so it clears the edge before
          // looping — no pop, seamless return from the left.
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(300%)" },
        },
        wiggle: {
          "0%,100%": { transform: "rotate(-6deg)" },
          "50%": { transform: "rotate(6deg)" },
        },
      },
      animation: {
        pop: "pop 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        float: "float 18s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        wiggle: "wiggle 0.6s ease-in-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
