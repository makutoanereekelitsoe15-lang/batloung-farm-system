// vite.config.js
// The dev server forwards every /api request to the Express server on
// port 5000. That is why the React code can simply call "/api/suppliers".
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
