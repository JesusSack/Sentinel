/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'osint-dark': '#0f172a',
        'osint-card': '#1e293b',
        'osint-accent': '#3b82f6',
        'risk-high': '#ef4444',
        'risk-med': '#f59e0b',
        'risk-low': '#10b981',
      }
    },
  },
  plugins: [],
}