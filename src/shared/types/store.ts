import { z } from 'zod'

export interface StoreState extends Record<string, unknown> {
  app: AppSlice
  settings: SettingsSlice
}

export interface AppSlice {
  data: string | null
  isBusy: boolean
  currentFilePath: string | null
  hasUnsavedChanges: boolean
  tree: unknown[]
  setData: (data: string | null) => void
  setIsBusy: (isBusy: boolean) => void
  setCurrentFilePath: (currentFilePath: string | null) => void
  clearData: () => void
  setTree: (tree: unknown[]) => void
}

export const SettingsValidationSchema = z
  .object({
    theme: z.string(),
    colorMode: z.enum(['light', 'dark', 'system']),
    autoSave: z.boolean(),
    logoPath: z.string().nullable(),
    preRunScript: z.string().nullable(),
    postRunScript: z.string().nullable(),
    outputDir: z.string().nullable(),
    recentFiles: z.array(z.string()),
    // API
    apiEnabled: z.boolean(),
    apiKey: z.string().nullable(),
    apiPort: z.number()
  })
  .strip()
export type SettingsState = z.infer<typeof SettingsValidationSchema>

export interface SettingsSlice extends SettingsState {
  restoreDefaults: () => void
  setSettings: (changedSettings: Partial<SettingsState>) => void
  setTheme: (theme: string) => void
  setAutoSave: (autoSave: boolean) => void
  addRecentFile: (newFile: string) => void
  clearRecentFiles: () => void
}
