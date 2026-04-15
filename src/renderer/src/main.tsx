// React
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// React Router
import { RouterProvider, createRouter, createHashHistory } from '@tanstack/react-router'
import { Button, Group, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
// Custom providers
import { Providers } from './Providers'
// Mantine
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css' // Note: Must be after '@mantine/core/styles.css'
// Import the generated route tree
import { routeTree } from './routeTree.gen'
// CSS
import './assets/main.css'
import { parseSettingsSection, type SettingsSectionKey } from './utils/settingsNavigation'

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

type AppNotificationPayload = {
  level?: 'info' | 'warning' | 'error'
  title: string
  message: string
  action?: {
    label: string
    section?: SettingsSectionKey
  }
}

const notificationColorByLevel: Record<NonNullable<AppNotificationPayload['level']>, string> = {
  info: 'blue',
  warning: 'yellow',
  error: 'red'
}

const openSettingsSection = (section?: SettingsSectionKey): void => {
  if (section) {
    router.navigate({
      to: '/settings',
      search: { section }
    })
    return
  }

  router.navigate({ to: '/settings' })
}

ipcRenderer.on('show-about', () => {
  router.navigate({ to: '/about' })
})
ipcRenderer.on('show-import-options', () => {
  router.navigate({ to: '/import' })
})
ipcRenderer.on('show-export-options', (_, { format }) => {
  router.navigate({ to: '/export/$format', params: { format } })
})
ipcRenderer.on('show-settings', (_, payload?: { section?: unknown }) => {
  openSettingsSection(parseSettingsSection(payload?.section))
})
ipcRenderer.on('app:notify', (_, payload: AppNotificationPayload) => {
  const level = payload.level ?? 'info'
  const hasAction = Boolean(payload.action)

  notifications.show({
    color: notificationColorByLevel[level],
    title: payload.title,
    withCloseButton: true,
    autoClose: hasAction ? false : 5000,
    message: hasAction ? (
      <Group justify="space-between" align="center" wrap="nowrap">
        <Text size="sm">{payload.message}</Text>
        <Button
          size="xs"
          variant="light"
          onClick={() =>
            ipcRenderer.send('settings:open', {
              section: payload.action?.section
            })
          }
        >
          {payload.action?.label}
        </Button>
      </Group>
    ) : (
      payload.message
    )
  })
})

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement)
  root.render(
    <StrictMode>
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </StrictMode>
  )
}
