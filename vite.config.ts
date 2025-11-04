import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/war_m/',//
  build: {
    outDir: 'docs',
  },
  optimizeDeps: {
    include: ["@emotion/react","@emotion/styled"],
  },
});
