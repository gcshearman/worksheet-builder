import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],

  base: "/worksheet-builder",

  resolve: {
    // Let Vite read paths from tsconfig automatically
    tsconfigPaths: true,
  },
})