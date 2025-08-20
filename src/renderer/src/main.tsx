import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter, createHashHistory } from '@tanstack/react-router'
import { ThemeProvider } from '@renderer/components/theme-provider'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

import './assets/main.css'

// Use alternative hash history
const hashHistory = createHashHistory()

// Create a new router instance
const router = createRouter({ routeTree, history: hashHistory })

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Events which trigger navigate
const ipcRenderer = window.electron.ipcRenderer

ipcRenderer.on('show-about', () => {
  router.navigate({ to: '/about' })
})
ipcRenderer.on('show-import-options', () => {
  router.navigate({ to: '/import' })
})
ipcRenderer.on('show-export-options', (_, { format }) => {
  router.navigate({ to: '/export/$format', params: { format } })
})
ipcRenderer.on('show-settings', () => {
  router.navigate({ to: '/settings' })
})

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement)
  root.render(
    <StrictMode>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <RouterProvider router={router} />
      </ThemeProvider>
    </StrictMode>
  )
}
