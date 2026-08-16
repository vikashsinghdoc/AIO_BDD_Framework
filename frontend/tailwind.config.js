/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          bg: "#05060B",
          surface: "#0C0E17",
          surface2: "#141826",
          border: "#232A45"
        },
        signal: {
          // Status semantics are load-bearing UI (scan-at-a-glance pass/fail/pending) —
          // left untouched by the redesign, per explicit direction.
          pass: "#2DD4BF",
          fail: "#FB5A6E",
          pending: "#FBBF3D",
          skip: "#6B7280",
          brand: "#7C5CFF",
          brand2: "#A78BFA"
        },
        // Redesign-only accent spectrum (violet → cyan "aurora"), used for hero
        // treatments, glow, and gradient text. Never used for status.
        aurora: {
          violet: "#7C5CFF",
          iris: "#9B7BFF",
          magenta: "#FF6BCB",
          cyan: "#2FE6E0",
          skyline: "#4FA8FF"
        },
        ink: {
          primary: "#E9ECF4",
          muted: "#8A93AC",
          faint: "#535C77"
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
        glowFail: "0 0 0 1px rgba(251,90,110,0.3), 0 0 20px rgba(251,90,110,0.2)",
        // Hero-only, stronger dual-tone glow — reserved for the pilot pages'
        // primary surfaces, not spread across every panel (see the "restrained
        // glow" precedent already set for shadow-glow in Development Conventions).
        glowAurora: "0 0 0 1px rgba(124,92,255,0.35), 0 0 40px rgba(124,92,255,0.22), 0 0 80px rgba(47,230,224,0.12)",
        glowCyan: "0 0 0 1px rgba(47,230,224,0.3), 0 0 28px rgba(47,230,224,0.18)"
      },
      transitionTimingFunction: {
        // Curves from the emilkowalski/skills "animate" philosophy — built-in CSS
        // easings are too weak for UI motion. out-strong for entrances/exits,
        // inout-strong for on-screen movement.
        "out-strong": "cubic-bezier(0.23, 1, 0.32, 1)",
        "inout-strong": "cubic-bezier(0.77, 0, 0.175, 1)"
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
        },
        auroraDrift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" }
        },
        sheen: {
          "0%": { transform: "translateX(-120%) skewX(-15deg)" },
          "100%": { transform: "translateX(220%) skewX(-15deg)" }
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" }
        }
      },
      animation: {
        pulseRing: "pulseRing 1.8s cubic-bezier(0.2,0.6,0.4,1) infinite",
        scan: "scan 3s linear infinite",
        auroraDrift: "auroraDrift 8s ease-in-out infinite",
        sheen: "sheen 2.8s ease-in-out infinite",
        marquee: "marquee 22s linear infinite"
      }
    }
  },
  plugins: []
};
