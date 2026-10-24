import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * This config alone builds a read-only visual specimen. Normal vite.config.ts
 * never imports this entry or its styling. No Cloudflare provider or deployment.
 * Only the eight responsive pre-approved ANEVUM community artwork masters are
 * copied into this isolated review bundle (NOT the entire public directory).
 */
export default defineConfig({
  root: fileURLToPath(new URL('./review/continuance-cinematic-react/', import.meta.url)),
  base: './',
  publicDir: fileURLToPath(new URL('./public/assets/community-portals/', import.meta.url)),
  plugins: [react()],
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1' },
  build: {
    outDir: fileURLToPath(new URL('../dist/continuance-cinematic-react-review', import.meta.url)),
    emptyOutDir: true,
    sourcemap: false,
    target: 'es2022'
  }
});
