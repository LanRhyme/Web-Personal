/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'mono': ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'Monaco', 'Courier New', 'monospace'],
        'sans': ['"Montserrat"', '"Space Grotesk"', '"Inter"', 'sans-serif'],
        'art': ['"Playfair Display"', 'serif'],
      },
      colors: {
        'bg-primary': 'var(--color-bg)',
        'text-primary': 'var(--color-text)',
        'text-dim': 'var(--color-text-dim)',
        'brand': 'var(--color-brand)',
        'border-color': 'var(--color-border)',
        'card-bg': 'var(--color-card)',
      }
    },
  },
  plugins: [],
}
