import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // ← official Vite plugin for Tailwind v4

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'https://asmlmbackend-production.up.railway.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    rollupOptions: {
      external: [],
      output: {
        manualChunks: undefined,
      },
    },
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
})
