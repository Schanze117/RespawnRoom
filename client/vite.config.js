import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode }) => {

  const env = loadEnv(mode, process.cwd(), '')
  const isProduction = mode === 'production'
  
  return {
    plugins: [
      react(), 
      tailwindcss(),
      isProduction && visualizer({
        open: true,
        gzipSize: true,
        brotliSize: true,
        filename: 'dist/stats.html'
      })
    ],
    build: {
      sourcemap: !isProduction,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Core libraries
            if (id.includes('node_modules/react') || 
                id.includes('node_modules/react-dom') || 
                id.includes('node_modules/react-router-dom')) {
              return 'vendor-react'
            }
            
            // UI libraries and icons
            if (id.includes('node_modules/react-icons') || 
                id.includes('node_modules/lucide-react')) {
              return 'vendor-ui'
            }
            
            // Apollo and GraphQL
            if (id.includes('node_modules/@apollo') || 
                id.includes('node_modules/graphql')) {
              return 'vendor-apollo'
            }
            
            // Date formatting
            if (id.includes('node_modules/date-fns')) {
              return 'vendor-date-fns'
            }
            
            // Media components
            if (id.includes('node_modules/react-youtube') || 
                id.includes('node_modules/pubnub')) {
              return 'vendor-media'
            }
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
          target: 'http://localhost:3001',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/auth/, '/auth'),
        },
        '/graphql': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        }
      },
      port: 3000,
      open: true
    }
  }
})

