import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';
import renderer from 'vite-plugin-electron-renderer';

// The API base URL lives in src/config.js (never here) so there is a single
// place to point the app at another server.
//
// `base: './'` makes the production build load from relative paths, which is
// what the packaged desktop app needs (it opens dist/index.html via file://).
export default defineConfig({
  base: './',
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main.js',
      },
      preload: {
        input: 'electron/preload.js',
      },
    }),
    renderer(),
  ],
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
