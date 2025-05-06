import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            youtube: ['react-youtube'],
            date: ['date-fns']
          }
        }
      },
      chunkSizeWarningLimit: 1000
    },
    server: {
      proxy: {
        '/api2': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api2/, '/api2'),
        },
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/api'),
        },
        '/auth': {
          target: 'http://localhost:3001', // Proxy to your server
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/auth/, '/auth'),
        },
      },
      port: 3000,
      open: true
    },
    define: {
      // Make all environment variables available to the client
      // This exposes env variables without the need for VITE_ prefix
      'import.meta.env.AGORA_APP_ID': JSON.stringify(env.AGORA_APP_ID)
    }
  }
})

