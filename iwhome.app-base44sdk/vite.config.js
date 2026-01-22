import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({

  plugins: [
    react(),
  ],
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: [
        '..',
        '../..',

      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});