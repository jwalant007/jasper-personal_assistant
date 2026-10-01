import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [tailwindcss(), react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) {
            return 'vendor-three';
          }
          if (id.includes('node_modules/leaflet')) {
            return 'vendor-leaflet';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-core';
          }
        }
      }
    }
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    allowedHosts: true,
    watch: {
      ignored: ['**/android/**']
    },
    hmr: {
      clientPort: 5173
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true
      },
      '/ws': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/ws/, '')
      }
    }
  },
  preview: {
    port: 5173,
    host: '0.0.0.0'
  }
});
