/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        round: [
          "ui-rounded",
          "Hiragino Maru Gothic ProN",
          "Quicksand",
          "Comfortaa",
          "Manjari",
          "Arial Rounded MT",
          "Arial Rounded MT Bold",
          "Calibri",
          "source-sans-pro",
          "sans-serif",
        ],
      },
      colors: {
        night: {
          900: "#141234",
          800: "#1d1a4b",
          700: "#282364",
        },
        spark: {
          300: "#ffe08a",
          400: "#ffd15c",
          500: "#ffbe2e",
        },
      },
      keyframes: {
        "pop-in": {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "70%": { transform: "scale(1.06)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        wobble: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-3deg)" },
          "75%": { transform: "rotate(3deg)" },
        },
        floaty: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "pop-in": "pop-in 0.35s ease-out both",
        wobble: "wobble 0.5s ease-in-out",
        floaty: "floaty 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
