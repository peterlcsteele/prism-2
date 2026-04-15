import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
        '@types': resolve('src/shared/types')
      }
    }
  },
  preload: {
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
        '@types': resolve('src/shared/types')
      }
    }
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
        // Renderer root is `src/renderer`, so keep paths relative to it.
        routesDirectory: './src/routes',
        generatedRouteTree: './src/routeTree.gen.ts'
      }),
      // React
      react()
    ]
  }
})
