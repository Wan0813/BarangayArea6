import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The API base URL lives in src/config.js (never here) so there is a single
// place to point the app at another server.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    open: false,
  },
  preview: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
