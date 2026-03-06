import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { compression } from 'vite-plugin-compression2';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh
      fastRefresh: true,
      // Babel optimizations
      babel: {
        plugins: [
          // Remove console logs in production
          ['transform-remove-console', { exclude: ['error', 'warn'] }]
        ]
      }
    }),
    // Gzip compression
    compression({
      algorithm: 'gzip',
      exclude: [/\.(br)$/, /\.(gz)$/],
      threshold: 1024, // Only compress files larger than 1KB
      deleteOriginFile: false
    }),
    // Brotli compression
    compression({
      algorithm: 'brotliCompress',
      exclude: [/\.(br)$/, /\.(gz)$/],
      threshold: 1024,
      deleteOriginFile: false
    }),
    // Bundle analyzer (only in analyze mode)
    process.env.ANALYZE && visualizer({
      open: true,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true
    })
  ],
  
  // Build optimizations
  build: {
    // Output directory
    outDir: 'dist',
    
    // Generate sourcemaps for debugging (disable in production)
    sourcemap: false,
    
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs
        drop_debugger: true, // Remove debugger statements
        pure_funcs: ['console.log', 'console.info'], // Remove specific functions
        passes: 2 // Multiple passes for better compression
      },
      mangle: {
        safari10: true // Fix Safari 10 issues
      },
      format: {
        comments: false // Remove comments
      }
    },
    
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    
    // Rollup options
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // UI libraries
          'ui-vendor': ['lucide-react', 'react-lazy-load-image-component'],
          
          // Supabase
          'supabase-vendor': ['@supabase/supabase-js'],
          
          // Socket.io
          'socket-vendor': ['socket.io-client'],
          
          // Contexts (lazy load)
          'contexts': [
            './src/context/AuthContext.jsx',
            './src/context/ContentContext.jsx',
            './src/context/FavoritesContext.jsx',
            './src/context/FriendsContext.jsx',
            './src/context/NotificationContext.jsx',
            './src/context/ProfileContext.jsx',
            './src/context/SocketContext.jsx',
            './src/context/WatchPartyContext.jsx'
          ]
        },
        
        // Asset file names
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          
          if (/\.css$/i.test(assetInfo.name)) {
            return `assets/css/[name]-[hash][extname]`;
          }
          
          return `assets/[name]-[hash][extname]`;
        },
        
        // Chunk file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    },
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Optimize dependencies
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  
  // Development server optimizations
  server: {
    port: 5173,
    strictPort: false,
    host: true,
    
    // Enable CORS
    cors: true,
    
    // HMR options
    hmr: {
      overlay: true
    },
    
    // Watch options
    watch: {
      usePolling: false,
      interval: 100
    }
  },
  
  // Preview server
  preview: {
    port: 4173,
    strictPort: false,
    host: true
  },
  
  // Dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'socket.io-client',
      'lucide-react',
      'react-lazy-load-image-component'
    ],
    exclude: ['@vite/client', '@vite/env']
  },
  
  // Resolve options
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@context': '/src/context',
      '@hooks': '/src/hooks',
      '@styles': '/src/styles',
      '@utils': '/src/utils',
      '@config': '/src/config',
      '@data': '/src/data'
    }
  },
  
  // CSS options
  css: {
    devSourcemap: false,
    preprocessorOptions: {
      css: {
        charset: false
      }
    }
  },
  
  // Performance options
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    legalComments: 'none',
    treeShaking: true
  }
});
