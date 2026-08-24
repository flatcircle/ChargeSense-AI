/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0B0E14',
          800: '#151A23',
          700: '#1F2937',
          600: '#374151',
        },
        brand: {
          DEFAULT: '#10b981', // Emerald 500
          light: '#34d399',   // Emerald 400
          dark: '#059669',    // Emerald 600
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
