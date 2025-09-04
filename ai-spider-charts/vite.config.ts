import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

// export default defineConfig({
//   plugins: [react()],
//   resolve: {
//     alias: { "@": path.resolve(__dirname, "./src") },
//   },
//   // 👇 If your repo is github.com/<you>/<repo>
//   base: "/UseCase_SpiderChart_Split/", // <-- set to "/<repo-name>/"
// })

export default defineConfig({
  plugins: [react()],
  base: "/UseCase_SpiderChart_Split/",  // <- the PAGES URL will be /<repo>/
})
