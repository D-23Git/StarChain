import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    global: 'globalThis',
  },
  server: {
    port: 5180, // Forced Port Change to bypass browser cache
    open: true,
  },
})
