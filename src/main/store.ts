import { createStore, StateCreator } from 'zustand/vanilla'

import type { AppSlice, SettingsSlice, StoreState } from '@shared/types/store'

export const createAppSlice: StateCreator<StoreState, [], [], AppSlice> = (set) => ({
  data: null,
  isBusy: false,
  currentFilePath: null,
  hasUnsavedChanges: false,
  setData: (data: string | null) => {
    set((state) => ({
      app: { ...state.app, data }
    }))
  },
  setIsBusy: (isBusy: boolean) => {
    set((state) => ({
      app: { ...state.app, isBusy }
    }))
  },
  setCurrentFilePath: (currentFilePath: string | null) =>
    set((state) => ({
      app: { ...state.app, currentFilePath }
    })),

  clearData: () =>
    set((state) => ({
      app: { ...state.app, data: null, currentFilePath: null }
    }))
})

export const createSettingsSlice: StateCreator<StoreState, [], [], SettingsSlice> = (set) => ({
  theme: 'light',
  autoSave: true,
  recentFiles: [],
  setTheme: (theme: 'light' | 'dark') =>
    set((state) => ({
      settings: { ...state.settings, theme }
    })),
  setAutoSave: (autoSave: boolean) =>
    set((state) => ({
      settings: { ...state.settings, autoSave }
    })),
  addRecentFile: (newFile: string) =>
    set((state) => ({
      settings: {
        ...state.settings,
        recentFiles: [newFile, ...state.settings.recentFiles.filter((f) => f !== newFile)].slice(
          0,
          10
        )
      }
    })),
  clearRecentFiles: () =>
    set((state) => ({
      settings: { ...state.settings, recentFiles: [] }
    }))
})

export const store = createStore<StoreState>()((...args) => ({
  app: createAppSlice(...args),
  settings: createSettingsSlice(...args)
}))
