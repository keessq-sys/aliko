import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
      colors: {
        // ── Brand palette ──────────────────────────────────────
        obsidian:  { DEFAULT: "#050A0E", 50: "#0D1B2A", 100: "#0A1628", 200: "#111F33", 300: "#1A2B3C", 400: "#243547", 500: "#2E3F52", 600: "#3B4F63", 700: "#4A5F74", 800: "#5A7085", 900: "#6B8196" },
        emerald:   { DEFAULT: "#059669", light: "#34D399", dark: "#064E3B", muted: "#065F46" },
        gold:      { DEFAULT: "#D97706", light: "#F59E0B", pale: "#FEF3C7", dark: "#92400E" },
        surface:   { 0: "#050A0E", 1: "#0A1628", 2: "#111F33", 3: "#1A2B3C", glass: "rgba(255,255,255,0.04)" },
        border:    { DEFAULT: "rgba(255,255,255,0.08)", strong: "rgba(255,255,255,0.14)", accent: "rgba(5,150,105,0.35)" },
      },
      fontFamily: {
        serif: ["Instrument Serif", "Playfair Display", "Georgia", "serif"],
        sans:  ["Inter", "system-ui", "sans-serif"],
        mono:  ["JetBrains Mono", "Fira Code", "monospace"],
      },
      fontSize: {
        "display-2xl": ["4.5rem",  { lineHeight: "1.05", letterSpacing: "-0.025em" }],
        "display-xl":  ["3.75rem", { lineHeight: "1.07", letterSpacing: "-0.02em"  }],
        "display-lg":  ["3rem",    { lineHeight: "1.08", letterSpacing: "-0.018em" }],
        "display-md":  ["2.25rem", { lineHeight: "1.1",  letterSpacing: "-0.015em" }],
        "display-sm":  ["1.875rem",{ lineHeight: "1.2",  letterSpacing: "-0.01em"  }],
      },
      backgroundImage: {
        "luxury-gradient": "linear-gradient(135deg, #050A0E 0%, #0A1628 50%, #0D2B1F 100%)",
        "gold-gradient":   "linear-gradient(135deg, #D97706, #F59E0B)",
        "emerald-gradient":"linear-gradient(135deg, #064E3B, #059669)",
        "glass-gradient":  "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))",
        "hero-radial":     "radial-gradient(ellipse 80% 60% at 50% -5%, rgba(6,78,59,0.45) 0%, transparent 65%)",
        "grid-pattern":    "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
      },
      boxShadow: {
        "luxury":    "0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)",
        "glow-gold": "0 0 24px rgba(217,119,6,0.2), 0 0 48px rgba(217,119,6,0.1)",
        "glow-em":   "0 0 24px rgba(5,150,105,0.2), 0 0 48px rgba(5,150,105,0.1)",
        "card":      "0 1px 0 rgba(255,255,255,0.06) inset, 0 8px 32px rgba(0,0,0,0.32)",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      backdropBlur: {
        "xs": "4px",
      },
      // ── Non-standard durations used in buttons, tabs, wizard, sidebar ──
      transitionDuration: {
        "250": "250ms",
        "450": "450ms",
      },
      animation: {
        "float":     "float 6s ease-in-out infinite",
        "float-r":   "float 8s ease-in-out infinite reverse",
        "fade-up":   "fadeUp 0.6s ease forwards",
        "fade-in":   "fadeIn 0.4s ease forwards",
        "glow-pulse":"glowPulse 2.5s ease-in-out infinite",
        "slide-in":  "slideIn 0.35s ease forwards",
        "shimmer":   "shimmer 2s linear infinite",
      },
      keyframes: {
        float:      { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-12px)" } },
        fadeUp:     { from: { opacity: "0", transform: "translateY(20px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        fadeIn:     { from: { opacity: "0" }, to: { opacity: "1" } },
        glowPulse:  { "0%,100%": { opacity: ".4" }, "50%": { opacity: "1" } },
        slideIn:    { from: { opacity: "0", transform: "translateX(-10px)" }, to: { opacity: "1", transform: "translateX(0)" } },
        shimmer:    { from: { transform: "translateX(-100%)" }, to: { transform: "translateX(100%)" } },
      },
      transitionTimingFunction: {
        "luxury": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      transitionDuration: {
        "250": "250ms",
        "450": "450ms",
      },
    },
  },
  plugins: [],
  // Safelist ensures Tailwind never purges dynamic color classes
  // used in HowItWorks step cards (emerald, amber, blue variants)
  safelist: [
    { pattern: /^(bg|text|border)-(emerald|amber|blue|sky)-(400|500)\/?(10|20)?$/ },
    { pattern: /^bg-(emerald|amber|blue|sky)-500\/20$/, variants: ["group-hover"] },
  ],
};

export default config;
