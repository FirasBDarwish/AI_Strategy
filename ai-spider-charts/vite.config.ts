import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Replace with your repo name
export default defineConfig({
  plugins: [react()],
  base: '/UseCase_SpiderChart_Split/',  // 👈 this must match your GitHub repo name
})
