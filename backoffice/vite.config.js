import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath, URL } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
  },
  resolve: {
    extensions: ['.mjs', '.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '$components': path.resolve(__dirname, 'src/components'),
      '$pages': path.resolve(__dirname, 'src/pages'),
      '$store': path.resolve(__dirname, 'src/store'),
      '$utils': path.resolve(__dirname, 'src/utils'),
    },
  },
})
