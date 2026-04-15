import { DEFAULT_THEME, MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { useStore } from './hooks/useStore'

export const Providers = ({ children }: { children: React.ReactNode }): React.JSX.Element => {
  const theme = useStore((state) => state.settings.theme)
  const colorMode = useStore((state) => state.settings.colorMode)
  const primaryColor =
    (DEFAULT_THEME.colors as Record<string, readonly string[]>)[theme] !== undefined ? theme : 'blue'

  return (
    <MantineProvider
      theme={{
        // fontFamily: 'Open Sans, sans-serif',
        // lineHeight: 1.2,
        primaryColor
      }}
      forceColorScheme={colorMode === 'system' ? undefined : colorMode}
    >
      <Notifications limit={1} autoClose={2500} />
      {children}
    </MantineProvider>
  )
}
