import {
  Button,
  ColorPicker,
  Grid,
  Image,
  Stack,
  Group,
  Divider,
  Select,
  Switch,
  TextInput,
  DEFAULT_THEME,
  NumberInput,
  Text
} from '@mantine/core'
import { useEffect } from 'react'

import { createFileRoute } from '@tanstack/react-router'
import { ColorModeToggle } from '@renderer/components/color-mode-toggle'
import { useStore } from '@renderer/hooks/useStore'
import { useDispatch } from '@zubridge/electron'
import logoDefault from '@renderer/assets/electron.svg'
// Icons
import { FaTrash, FaCopy, FaSync } from 'react-icons/fa'
import { useAppOperations } from '@renderer/hooks/useAppOperations'
import { notifications } from '@mantine/notifications'
import {
  getSettingsSectionDomId,
  parseSettingsSection,
  scrollToSettingsSection
} from '@renderer/utils/settingsNavigation'

const ipcRenderer = window.electron.ipcRenderer

const THEME_COLOR_ENTRIES = Object.entries(DEFAULT_THEME.colors) as [string, readonly string[]][]
const THEME_OPTIONS = THEME_COLOR_ENTRIES.map(([value]) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1)
}))
const THEME_SWATCHES = THEME_COLOR_ENTRIES.map(([, scale]) => scale[7])
const THEME_NAME_BY_SWATCH = new Map(
  THEME_COLOR_ENTRIES.map(([name, scale]) => [scale[7].toLowerCase(), name])
)
const API_SERVER_SECTION_ID = getSettingsSectionDomId('api-server')

export const Route = createFileRoute('/settings')({
  validateSearch: (search: Record<string, unknown>) => {
    const section = parseSettingsSection(search.section)
    return section ? { section } : {}
  },
  component: SettingsComponent
})

function SettingsComponent(): React.JSX.Element {
  const dispatch = useDispatch()
  const { section } = Route.useSearch()
  const settings = useStore((store) => store.settings)
  const [openAtLogin, setOpenAtLogin] = useAppOperations()
  const themeSwatch =
    (DEFAULT_THEME.colors as Record<string, readonly string[]>)[settings.theme]?.[7] ??
    DEFAULT_THEME.colors.blue[7]

  useEffect(() => {
    if (!section) return

    requestAnimationFrame(() => {
      scrollToSettingsSection(section)
    })
  }, [section])

  return (
    <Stack gap="lg" p="md">
      <Group align="center" gap="xs">
        {/* Title */}
        {/* <Title order={2} flex={1}>
          <Group align="center" gap="xs">
            <FaCog /> Settings
          </Group>
        </Title> */}
        {/* <SettingsOptionsMenu /> */}
      </Group>

      <Divider label="Theme" labelPosition="left" />

      <Stack gap="sm">
        <Group>
          <Label>Color mode</Label>
          <ColorModeToggle
            colorMode={settings.colorMode}
            onChange={(colorMode) => dispatch('settings.setSettings', { colorMode })}
          />
        </Group>
        <Stack gap="xs">
          <Label>Theme</Label>
          <Select
            data={THEME_OPTIONS}
            value={settings.theme}
            onChange={(theme) => {
              if (theme) {
                dispatch('settings.setSettings', { theme })
              }
            }}
            style={{ flex: 1 }}
            allowDeselect={false}
          />
          <ColorPicker
            size="md"
            withPicker={false}
            value={themeSwatch}
            swatches={THEME_SWATCHES}
            onChange={(color) => {
              const nextTheme = THEME_NAME_BY_SWATCH.get(color.toLowerCase())
              if (nextTheme && nextTheme !== settings.theme) {
                dispatch('settings.setSettings', { theme: nextTheme })
              }
            }}
          />
        </Stack>
      </Stack>

      <Stack gap="xs">
        <Label required={true}>Output directory</Label>
        <Group>
          <TextInput
            value={settings.outputDir || ''}
            placeholder="Select output directory"
            required
            readOnly
            style={{ flex: 1 }}
          />
          <Button onClick={() => window.api.setOutputDir()} variant="default">
            Browse
          </Button>
        </Group>
      </Stack>

      <Stack
        gap="xl"
        id={API_SERVER_SECTION_ID}
        data-settings-section={API_SERVER_SECTION_ID}
        tabIndex={-1}
      >
        <Divider label="Integrations" labelPosition="left" />

        <Group>
          <Label>Enable API server</Label>
          <Text size="sm">
            {settings.apiEnabled ? `Listening on port ${settings.apiPort}` : `Not started`}
          </Text>
          <Switch
            withThumbIndicator={false}
            checked={settings.apiEnabled}
            onChange={(e) => ipcRenderer.send('api:set-enabled', e.currentTarget.checked)}
            size="md"
          />
        </Group>

        <Group align="flex-start">
          <Stack gap="xs">
            <Label required>Port</Label>
            <NumberInput
              value={settings.apiPort || ''}
              placeholder="Enter a port"
              required
              disabled={settings.apiEnabled}
              min={1}
              max={65535}
              onChange={(value) => {
                if (typeof value === 'number' && !Number.isNaN(value)) {
                  dispatch('settings.setSettings', { apiPort: value })
                }
              }}
              maw={150}
            />
          </Stack>
          <Stack gap="xs" flex="1">
            <Label required={true}>API Key</Label>
            <Group gap="xs">
              <TextInput
                disabled={!settings.apiKey}
                value={settings.apiKey || ''}
                placeholder="Enter an API key (32-64 chars)"
                required
                minLength={32}
                maxLength={64}
                style={{ flex: 1 }}
                onChange={(e) => dispatch('settings.setAPIKey', e.currentTarget.value)}
                rightSection={
                  settings.apiKey && (
                    <FaCopy
                      onClick={() => {
                        ipcRenderer.send('system:write-to-clipboard', settings.apiKey)
                        notifications.clean()
                        notifications.show({
                          title: 'Copied to clipboard',
                          message: settings.apiKey
                        })
                      }}
                    />
                  )
                }
                rightSectionProps={{
                  style: {
                    cursor: 'pointer'
                  }
                }}
              />
              <Button
                disabled={settings.apiEnabled}
                onClick={() => {
                  ipcRenderer.send('settings:generateAPIKey')
                }}
                variant="default"
                leftSection={<FaSync />}
              >
                Regenerate
              </Button>
            </Group>
          </Stack>
        </Group>
      </Stack>

      <Divider label="Paths & Scripts" mt="lg" labelPosition="left" />

      {/* Logo field: image + text input + browse */}
      <Stack>
        <Label>Logo</Label>
        <Group gap="xs" style={{ flex: 1 }}>
          <Image
            h={80}
            w={80}
            fit="contain"
            src={`file://${settings.logoPath}`}
            fallbackSrc={logoDefault}
            style={{ border: '1px solid #111' }}
            onClick={() => window.api.setLogoPath()}
          />
          <TextInput
            flex={1}
            value={settings.logoPath || ''}
            placeholder="Select logo file"
            readOnly
          />
          <Button onClick={() => window.api.setLogoPath()} variant="default">
            Browse
          </Button>
          {settings.logoPath && (
            <Button
              aria-label="Remove"
              variant="default"
              onClick={() => window.api.clearLogoPath()}
            >
              <FaTrash />
            </Button>
          )}
        </Group>
      </Stack>

      <Group grow={true}>
        <Stack>
          <Label>Pre-run script</Label>
          <Group gap="xs">
            <TextInput
              value={settings.preRunScript || ''}
              placeholder="Select a file"
              readOnly
              style={{ flex: 1 }}
            />
            <Button onClick={() => window.api.setPreRunScript()} variant="default">
              Browse
            </Button>
            {settings.preRunScript && (
              <Button
                aria-label="Remove"
                variant="default"
                onClick={() => dispatch('settings.setSettings', { preRunScript: null })}
              >
                <FaTrash />
              </Button>
            )}
          </Group>
        </Stack>
        <Stack>
          <Label>Post-run script</Label>
          <Group gap="xs">
            <TextInput
              value={settings.postRunScript || ''}
              placeholder="Select a file"
              readOnly
              style={{ flex: 1 }}
            />
            <Button onClick={() => window.api.setPostRunScript()} variant="default">
              Browse
            </Button>
            {settings.postRunScript && (
              <Button
                aria-label="Remove"
                variant="default"
                onClick={() => dispatch('settings.setSettings', { postRunScript: null })}
              >
                <FaTrash />
              </Button>
            )}
          </Group>
        </Stack>
      </Group>

      <Group>
        <Label>Enable autosave</Label>
        <Switch
          withThumbIndicator={false}
          checked={settings.autoSave}
          onChange={(e) =>
            dispatch('settings.setSettings', {
              autoSave: e.currentTarget.checked
            })
          }
          size="md"
        />
      </Group>

      <Group>
        <Label>Open at login</Label>
        <Switch
          withThumbIndicator={false}
          checked={openAtLogin}
          onChange={(e) => setOpenAtLogin(e.currentTarget.checked)}
          size="md"
        />
      </Group>

      <Divider mt="lg" />

      <Grid align="stretch" columns={24} mt="md">
        <Grid.Col span={{ base: 24, sm: 6 }}>Developer</Grid.Col>
        <Grid.Col span={{ base: 24, sm: 18 }}>
          <pre style={{ fontSize: '0.6rem' }}>{JSON.stringify(settings, null, '\t')}</pre>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}

function Label({
  children,
  required
}: {
  children: React.ReactNode
  required?: boolean
}): React.JSX.Element {
  return (
    <div style={{ fontSize: '0.9rem', fontWeight: 500, flex: 1 }}>
      {children}
      {required ? <span style={{ color: 'red', marginLeft: '0.2rem' }}>*</span> : null}
    </div>
  )
}
