import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/aws-contract-analyzer/',
  server: {
    proxy: {
      '/analyze': 'http://localhost:5000'
    }
  }
});
