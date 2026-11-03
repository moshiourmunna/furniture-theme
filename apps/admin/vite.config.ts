import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const API = process.env.API_ORIGIN || 'http://localhost:3100';

// The admin SPA talks to the Next.js REST API. In dev, Vite proxies /api and media to the web app so cookies stay same-origin.
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { port: 5173, strictPort: true, proxy: { '/api': API, '^/media/': API, '^/uploads/': API, '^/brand/': API } },
  preview: { port: 5173, proxy: { '/api': API, '^/media/': API, '^/uploads/': API, '^/brand/': API } },
  build: { outDir: 'dist', sourcemap: false, chunkSizeWarningLimit: 900 },
});
