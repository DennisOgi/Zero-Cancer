import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import { resolve } from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite({ autoCodeSplitting: true }),
    viteReact(),
    tailwindcss(),
  ],
  // test: {
  //   globals: true,
  //   environment: 'jsdom',
  // },
  resolve: {
    alias: [
      { find: '@', replacement: resolve(__dirname, './src') },
      // The bare import must hit the TypeScript source: the package's `main`
      // points at a gitignored dist/ build that fresh checkouts don't have.
      {
        find: /^@zerocancer\/shared$/,
        replacement: resolve(__dirname, '../../packages/shared/index.ts'),
      },
      {
        find: '@zerocancer/shared',
        replacement: resolve(__dirname, '../../packages/shared'),
      },
    ],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/, /packages[\\/]shared/],
      transformMixedEsModules: true,
    },
    // Optimize for memory usage
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries into separate chunks
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['@tanstack/react-router', '@tanstack/react-query'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'utils-vendor': ['axios', 'date-fns', 'clsx', 'tailwind-merge']
        }
      }
    },
    // Reduce memory usage during build
    minify: 'esbuild',
    sourcemap: false,
    // Optimize asset handling
    assetsInlineLimit: 4096,
    // Skip type checking in production builds for speed
    target: 'esnext'
  },
  // Optimize dev server memory
  server: {
    hmr: {
      overlay: false
    }
  },
  // Skip type checking when SKIP_TYPE_CHECK is true
  esbuild: process.env.SKIP_TYPE_CHECK === 'true' ? {
    target: 'esnext',
    format: 'esm'
  } : undefined
})
