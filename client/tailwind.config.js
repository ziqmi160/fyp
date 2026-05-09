/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8B0000',
          light: '#B22222',
        },
        secondary: '#1E3A5F',
        accent: '#F59E0B',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        background: '#F8FAFC',
        card: '#FFFFFF',
      }
    },
  },
  plugins: [],
}
