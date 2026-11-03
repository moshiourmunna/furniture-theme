import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const API = process.env.API_ORIGIN || 'http://localhost:3000';

// The admin SPA talks to the Next.js REST API. In dev, Vite proxies /api and media to the web app so cookies stay same-origin.
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { port: 5173, strictPort: true, proxy: { '/api': API, '^/media/': API, '^/uploads/': API, '^/brand/': API } },
  preview: { port: 5173, proxy: { '/api': API, '^/media/': API, '^/uploads/': API, '^/brand/': API } },
  build: {
    outDir: 'dist', sourcemap: false, chunkSizeWarningLimit: 600,
    rollupOptions: { output: { manualChunks(id) {
      if (!id.includes('node_modules')) return undefined;
      if (/recharts|d3-|victory/.test(id)) return 'charts';
      if (/react-dom|react-router|scheduler|\/react\//.test(id)) return 'react';
      if (/zod|react-hook-form|@hookform|@tanstack/.test(id)) return 'forms';
      return 'vendor';
    } } },
  },
});
