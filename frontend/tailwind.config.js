/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ── Accent / Primary (Orange tones) ──────────────────
        primary: "#FF6F00", // Vibrant Orange — CTA, Play, Sign In
        "accent-amber": "#FFA000", // Sunset Amber  — hover, gradient
        "accent-peach": "#FFB366", // Soft Peach    — highlight, important text

        // ── Background (Warm Dark Gray) ───────────────────────
        "background-dark": "#121212", // Main background
        "surface-dark": "#1E1E1E", // Card / Sidebar
        "surface-dark-light": "#2C2C2C", // Hover / Active state

        // ── Typography ────────────────────────────────────────
        "text-primary": "#FFFFFF", // Heading — max contrast
        "text-secondary": "#B3B3B3", // Artist / description
        "text-muted": "#757575", // Hint / disabled
      },
      fontFamily: {
        sans: ["Inter", "Montserrat", "system-ui", "sans-serif"],
        display: ["Montserrat", "Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "1rem",
        lg: "2rem",
        xl: "3rem",
        full: "9999px",
      },
      fontSize: {
        // Typography scale from spec
        hero: [
          "clamp(2rem,5vw,2.5rem)",
          { fontWeight: "700", lineHeight: "1.1" },
        ],
        track: ["1rem", { fontWeight: "600" }],
        artist: ["0.875rem", { fontWeight: "400" }],
      },
    },
  },
  plugins: [],
};
