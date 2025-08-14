import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    resolve: {
      alias: {
        // '@shared': resolve('src/shared'),
        '@types': resolve('src/types')
      }
    },
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    resolve: {
      alias: {
        // '@shared': resolve('src/shared'),
        '@types': resolve('src/types')
      }
    },
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        // '@shared': resolve('src/shared'),
        '@types': resolve('src/types')
      }
    },
    plugins: [react()]
  }
})
