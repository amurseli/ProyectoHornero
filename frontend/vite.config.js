import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath, URL } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '$assets': path.resolve(__dirname, 'src/assets'),
      '$images': path.resolve(__dirname, 'src/assets/images'),
      '$fonts': path.resolve(__dirname, 'src/assets/fonts'),
      '$styles': path.resolve(__dirname, 'src/assets/styles'),
      '$commons': path.resolve(__dirname, 'src/assets/commons'),
      '$components': path.resolve(__dirname, 'src/components'),
      '$utils': path.resolve(__dirname, 'src/utils'),
      '$pages': path.resolve(__dirname, 'src/pages'),
      '$store': path.resolve(__dirname, 'src/store'),
    }
  }
})