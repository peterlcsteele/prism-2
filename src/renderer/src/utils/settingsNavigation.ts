export const SETTINGS_SECTION_KEYS = ['api-server'] as const

export type SettingsSectionKey = (typeof SETTINGS_SECTION_KEYS)[number]

const SETTINGS_SECTION_DOM_IDS: Record<SettingsSectionKey, string> = {
  'api-server': 'settings-section-api-server'
}

const SETTINGS_SECTION_KEY_SET = new Set<string>(SETTINGS_SECTION_KEYS)

export const parseSettingsSection = (value: unknown): SettingsSectionKey | undefined => {
  if (typeof value !== 'string') return undefined
  if (!SETTINGS_SECTION_KEY_SET.has(value)) return undefined
  return value as SettingsSectionKey
}

export const getSettingsSectionDomId = (section: SettingsSectionKey): string => {
  return SETTINGS_SECTION_DOM_IDS[section]
}

export const scrollToSettingsSection = (section: SettingsSectionKey): boolean => {
  const sectionId = getSettingsSectionDomId(section)
  const target = document.querySelector<HTMLElement>(
    `[data-settings-section="${sectionId}"], #${sectionId}`
  )

  if (!target) return false

  target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  target.focus({ preventScroll: true })
  return true
}
