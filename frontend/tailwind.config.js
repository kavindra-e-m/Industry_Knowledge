/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#07111F",
        sidebar: "#0F1C2E",
        card: "#16263D",
        "card-hover": "#1a2d47",
        border: "#1E3A5F",
        "border-bright": "#2a4a6b",
        accent: "#4F9DFF",
        purple: "#7C5CFC",
        healthy: "#34D399",
        warning: "#FBBF24",
        critical: "#FF5C5C",
        info: "#38BDF8",
        "text-primary": "#F0F6FF",
        "text-secondary": "#8BA3C7",
        "text-muted": "#4A6080",
      },
      fontFamily: {
        sora: ["Sora", "sans-serif"],
        jakarta: ['"Plus Jakarta Sans"', "sans-serif"],
        inter: ["Inter", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 24px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.3)",
        glow: "0 0 20px rgba(79,157,255,0.15)",
        "glow-purple": "0 0 20px rgba(124,92,252,0.2)",
        "glow-critical": "0 0 20px rgba(255,92,92,0.2)",
        "glow-healthy": "0 0 20px rgba(52,211,153,0.15)",
      },
      backgroundImage: {
        "gradient-card": "linear-gradient(135deg, #16263D 0%, #0F1C2E 100%)",
        "gradient-accent": "linear-gradient(135deg, #4F9DFF 0%, #7C5CFC 100%)",
        "gradient-critical": "linear-gradient(135deg, #FF5C5C 0%, #cc3333 100%)",
        "gradient-healthy": "linear-gradient(135deg, #34D399 0%, #059669 100%)",
        "gradient-sidebar": "linear-gradient(180deg, #0F1C2E 0%, #0a1520 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.35s ease-out",
        "slide-in-right": "slideInRight 0.35s ease-out",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
        "counter": "counter 1s ease-out",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        slideUp: { "0%": { opacity: 0, transform: "translateY(16px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        slideInRight: { "0%": { opacity: 0, transform: "translateX(16px)" }, "100%": { opacity: 1, transform: "translateX(0)" } },
        glowPulse: { "0%,100%": { opacity: 0.6 }, "50%": { opacity: 1 } },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
    },
  },
  plugins: [],
};
