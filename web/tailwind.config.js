/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", 
  ],
  theme: {
    extend: {
      colors: {
        'osint-dark': '#0a0a0a',   
        'osint-card': 'rgba(30, 41, 59, 0.7)', 
        'osint-accent': '#3b82f6', 
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}