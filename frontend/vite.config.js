import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath, URL } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '$lib': path.resolve(__dirname, 'src/lib'),
      '$images': path.resolve(__dirname, 'src/lib/assets/images'),
      '$fonts': path.resolve(__dirname, 'src/lib/assets/fonts'),
      '$commons': path.resolve(__dirname, 'src/lib/assets/commons'),
      '$styles': path.resolve(__dirname, 'src/lib/assets/styles'),
      '$components': path.resolve(__dirname, 'src/lib/components'),
      '$utils': path.resolve(__dirname, 'src/lib/utils'),
      '$pages': path.resolve(__dirname, 'src/pages'),
    }
  }
})