/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          bg: "#090C10",
          surface: "#12161D",
          surface2: "#1B212B",
          border: "#232A36"
        },
        signal: {
          pass: "#2DD4BF",
          fail: "#FB5A6E",
          pending: "#FBBF3D",
          skip: "#6B7280",
          brand: "#7C5CFF",
          brand2: "#A78BFA"
        },
        ink: {
          primary: "#E7EAF0",
          muted: "#8992A6",
          faint: "#57607A"
        }
      },
      fontFamily: {
        display: ["\"Space Grotesk\"", "sans-serif"],
        body: ["\"Inter\"", "sans-serif"],
        mono: ["\"JetBrains Mono\"", "monospace"]
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(124,92,255,0.25), 0 0 24px rgba(124,92,255,0.15)",
        glowPass: "0 0 0 1px rgba(45,212,191,0.3), 0 0 20px rgba(45,212,191,0.2)",
        glowFail: "0 0 0 1px rgba(251,90,110,0.3), 0 0 20px rgba(251,90,110,0.2)"
      },
      keyframes: {
        pulseRing: {
          "0%": { transform: "scale(0.9)", opacity: "0.8" },
          "70%": { transform: "scale(1.9)", opacity: "0" },
          "100%": { transform: "scale(1.9)", opacity: "0" }
        },
        scan: {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "0 40px" }
        }
      },
      animation: {
        pulseRing: "pulseRing 1.8s cubic-bezier(0.2,0.6,0.4,1) infinite",
        scan: "scan 3s linear infinite"
      }
    }
  },
  plugins: []
};
