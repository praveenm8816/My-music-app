import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101416",
        paper: "#F5F4EF",
        lime: "#D8FF3E",
        fog: "#D9DDD7",
        ember: "#FF694A"
      },
      fontFamily: {
        sans: ["var(--font-geist)", "Arial", "sans-serif"],
        display: ["var(--font-space)", "Arial", "sans-serif"]
      },
      boxShadow: {
        player: "0 18px 45px rgba(16, 20, 22, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
