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
          50: '#f5f7fa',
          100: '#e4e8f0',
          200: '#ccd4e2',
          300: '#a7b8cf',
          400: '#7c96b8',
          500: '#5c78a0',
          600: '#485e83',
          700: '#3b4c6c',
          800: '#32415c',
          900: '#2d384f',
          950: '#1f2637',
        },
      },
    },
  },
  plugins: [],
}
