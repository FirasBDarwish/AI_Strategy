import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/UseCase_SpiderChart_Split/', // 👈 important for GitHub Pages (repo name)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // 👈 match your tsconfig.json
    },
  },
})
