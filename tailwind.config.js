/** @type {import('tailwindcss').Config} */
export default {
  // Not strictly needed for our approach, but handy for future tweaks.
  // We’re NOT relying on `darkMode` here — we use CSS variables on a wrapper.
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
}
