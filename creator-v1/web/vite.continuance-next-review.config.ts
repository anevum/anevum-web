import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Explicit offline-review build. Does not change the normal Vite entry/output.
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: './',
  publicDir: false,
  plugins: [react()],
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1' },
  build: {
    outDir: fileURLToPath(new URL('../dist/continuance-next-review', import.meta.url)),
    emptyOutDir: true,
    sourcemap: false,
    target: 'es2022',
    rollupOptions: { input: fileURLToPath(new URL('./review/continuance-next/index.html', import.meta.url)) }
  }
});
