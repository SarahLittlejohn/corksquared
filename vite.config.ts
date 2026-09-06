import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Set `base` to '/<repo-name>/' if deploying to a GitHub Pages subpath.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  build: {
    assetsInlineLimit: 0,
  },
});
