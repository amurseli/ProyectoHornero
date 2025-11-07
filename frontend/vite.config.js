import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath, URL } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '$images': path.resolve(__dirname, 'src/assets/images'),
      '$components': path.resolve(__dirname, 'src/components'),
      '$pages': path.resolve(__dirname, 'src/pages'),
    }
  }
})