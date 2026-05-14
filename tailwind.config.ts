import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        glow: "0 0 50px rgba(255, 124, 0, 0.18)"
      },
      backgroundImage: {
        "hero-gradient": "radial-gradient(circle at top, rgba(255,255,255,0.18), transparent 35%), linear-gradient(135deg, #0f172a 0%, #020617 100%)"
      }
    }
  },
  plugins: []
};

export default config;
