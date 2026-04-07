import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    cssMinify: false,
  },
  server: {
    port: 5173,
    proxy: {
      '/predict': 'http://localhost:5000',
      '/history': 'http://localhost:5000',
      '/health':  'http://localhost:5000',
      '/fetch':   'http://localhost:5000',
      '/odds':    'http://localhost:5000',
      '/admin':   'http://localhost:5000',
      '/results': 'http://localhost:5000',
    },
  },
})
