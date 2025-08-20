import type { AnyState } from '@zubridge/electron'

export interface StoreState extends AnyState {
  app: AppSlice
  settings: SettingsSlice
}

export interface AppSlice {
  data: string | null
  isBusy: boolean
  currentFilePath: string | null
  hasUnsavedChanges: boolean
  // setData?: (data: string | null) => void
  // setIsBusy?: (isBusy: boolean) => void
  // setCurrentFilePath?: (currentFilePath: string | null) => void
  // clearData?: () => void
}

export interface SettingsSlice {
  theme: string
  autoSave: boolean
  recentFiles: string[]
  // setTheme?: (theme: 'light' | 'dark') => void
  // setAutoSave?: (autoSave: boolean) => void
  // addRecentFile?: (newFile: string) => void
  // clearRecentFiles?: () => void
}
