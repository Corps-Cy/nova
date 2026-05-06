import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3999',
      '/health': 'http://localhost:3999',
      '/widget.js': 'http://localhost:3999',
    },
  },
  build: {
    outDir: 'dist',
  },
})
