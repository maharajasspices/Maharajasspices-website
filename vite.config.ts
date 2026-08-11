import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import imagemin from "unplugin-imagemin/vite";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    imagemin({
      // Compress images aggressively for better performance
      compress: {
        jpg: {
          quality: 45,
        },
        jpeg: {
          quality: 45,
        },
        png: {
          quality: 50,
        },
        webp: {
          quality: 45,
        },
      },
      // Convert to WebP for better compression
      conversion: [
        { from: 'jpg', to: 'webp' },
        { from: 'jpeg', to: 'webp' },
        { from: 'png', to: 'webp' },
      ],
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: true,
    cssCodeSplit: true, // Split CSS per chunk to reduce render-blocking
    cssMinify: true, // Minimize CSS for faster loading
    minify: 'esbuild', // Use esbuild (built-in, no extra dependency)
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-accordion', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'supabase': ['@supabase/supabase-js'],
          'charts': ['recharts'],
        },
        // Ensure CSS is named predictably for preloading
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'index.css') {
            return 'assets/index-[hash].css';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: [],
  },
}));
