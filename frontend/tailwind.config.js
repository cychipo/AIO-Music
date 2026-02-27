/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // AIO-MUSIC Pastel Design System
        background: '#faf2e8',   // Kem nhạt
        surface: '#fde3c8',      // Đào nhạt
        primary: '#ffa883',      // Cam San hô
        accent: '#6fc7e2',       // Xanh trời

        // Extended palette
        'primary-light': '#ffcbb0',
        'primary-dark': '#e8845f',
        'accent-light': '#a3dff0',
        'accent-dark': '#4aa8c7',

        // Semantic
        'text-primary': '#3d2b1f',
        'text-secondary': '#7a5c4e',
        'text-muted': '#b89080',
        'border': '#f0d4be',
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        pastel: '0 4px 24px 0 rgba(255, 168, 131, 0.15)',
        'pastel-lg': '0 8px 40px 0 rgba(255, 168, 131, 0.2)',
        card: '0 2px 12px 0 rgba(61, 43, 31, 0.08)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
