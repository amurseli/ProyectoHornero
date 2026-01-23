/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#EC4899',
        secondary: '#8B5CF6',
        accent: '#38BDF8',
        background: '#FAFAFA',
        foreground: '#111827',
        muted: '#F3F4F6',
        'muted-foreground': '#6B7280',
        border: '#E5E7EB',
      },
    },
  },
  plugins: [],
}