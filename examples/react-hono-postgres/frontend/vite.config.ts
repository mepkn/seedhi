import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vite'

// The app always calls same-origin /api. In development Vite forwards it to
// the API on :3000; on the server Caddy does the same, so the built files
// contain no API URL and one build works in every environment.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@contract': path.resolve(import.meta.dirname, '../backend/src/contract.ts'),
    },
    // contract.ts imports zod; use this app's copy, not ../backend/node_modules.
    dedupe: ['zod'],
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
