/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./nuxt.config.{js,ts}",
    "./app.vue"
  ],
  theme: {
    extend: {
      colors: {
        'landingchat': '#10B981',
        'estudio': '#3B82F6',
        'tause': '#F59E0B',
        'otro': '#6B7280'
      }
    },
  },
  plugins: [],
}