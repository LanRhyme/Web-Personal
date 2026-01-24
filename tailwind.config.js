/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        'amethyst': 'var(--amethyst-color)',
        'amethyst-hover': 'var(--amethyst-color-hover)',
        'highlight-bg': 'var(--highlight-bg)',
        'bg-primary': 'var(--bg-primary)',
        'text-primary': 'var(--text-primary)',
        'card-bg': 'var(--card-bg)',
      }
    },
  },
  plugins: [],
}
