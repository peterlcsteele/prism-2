import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
        '@types': resolve('src/shared/types')
      }
    },
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
        '@types': resolve('src/shared/types')
      }
    },
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@shared': resolve('src/shared'),
        '@types': resolve('src/shared/types'),
        '@': resolve('src/renderer/src')
      }
    },
    plugins: [
      // Tanstack (Must be before react)
      tanstackRouter({
        target: 'react',
        autoCodeSplitting: true,
        // Config for electron-vite
        routesDirectory: './src/renderer/src/routes',
        generatedRouteTree: './src/renderer/src/routeTree.gen.ts'
      }),
      // React
      react(),
      tailwindcss()
    ]
  }
})
