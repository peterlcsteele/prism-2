// Zustand
import type { AppSlice, SettingsSlice, SettingsState, StoreState } from '@shared/types/store'
import { createStore, StateCreator } from 'zustand/vanilla'
import { persist, PersistStorage, StorageValue } from 'zustand/middleware'
import deepMerge from 'deepmerge'

// Electron store
import Store from 'electron-store'
const electronStore = new Store({})

// Adapter for zustand persist
const zustandPersistElectronStoreAdaptor: PersistStorage<Partial<StoreState>> = {
  getItem: async (name: string) => {
    // Get value
    const value = (await electronStore.get(name)) as StorageValue<Partial<StoreState>>
    // Log
    console.log(`getItem(${name})`)
    console.log(value)
    // Return value
    return value
  },
  setItem: async (name: string, value: StorageValue<Partial<StoreState>> | null): Promise<void> => {
    // Log
    // console.log(`setItem(${name})`)
    // console.log(value)
    // Set value
    await electronStore.set(name, value)
  },
  removeItem: async (name: string): Promise<void> => {
    // Log
    console.log(`removeItem(${name})`)
    // Delete
    await electronStore.delete(name)
  }
}

const createAppSlice: StateCreator<StoreState, [], [], AppSlice> = (set) => ({
  data: null,
  isBusy: false,
  currentFilePath: null,
  hasUnsavedChanges: false,
  tree: [],
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
  setCurrentFilePath: (currentFilePath: string | null) => {
    set((state) => ({
      app: { ...state.app, currentFilePath }
    }))
  },
  clearData: () => {
    set((state) => ({
      app: {
        ...state.app,
        data: null,
        currentFilePath: null,
        tree: []
      }
    }))
  },
  setTree: (tree) => {
    set((state) => ({
      app: { ...state.app, tree }
    }))
  }
})

const initialSettings: SettingsState = {
  theme: 'blue',
  colorMode: 'system',
  autoSave: true,
  recentFiles: [],
  logoPath: null,
  preRunScript: null,
  postRunScript: null,
  outputDir: null,
  apiKey: null,
  apiPort: 5456,
  apiEnabled: false
}

const createSettingsSlice: StateCreator<
  StoreState,
  [],
  [['zustand/persist', unknown]],
  SettingsSlice
> = (set) => ({
  // Initial values - may be overwritten by persist
  ...initialSettings,
  restoreDefaults: () => {
    set((state) => {
      return {
        ...state,
        settings: { ...state.settings, ...initialSettings }
      }
    })
  },
  // Actions
  setSettings: (changedSettings) => {
    set((state) => {
      return {
        ...state,
        settings: { ...state.settings, ...changedSettings }
      }
    })
  },
  setTheme: (theme: string) =>
    set((state) => {
      return {
        ...state,
        settings: { ...state.settings, theme }
      }
    }),
  setAutoSave: (autoSave: boolean) =>
    set((state) => ({ ...state, settings: { ...state.settings, autoSave } })),
  addRecentFile: (newFile: string) =>
    set((state) => ({
      ...state,
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
      ...state,
      settings: {
        ...state.settings,
        recentFiles: []
      }
    }))
})

export const store = createStore<StoreState>()(
  persist(
    (...args) => ({
      app: createAppSlice(...args),
      settings: createSettingsSlice(...args)
    }),
    {
      name: 'settings', // Key in electron-store
      // storage: createJSONStorage(() => zustandElectronStoreAdaptor),
      storage: zustandPersistElectronStoreAdaptor,
      merge: (persistedState, currentState) => {
        return deepMerge(currentState, persistedState as Partial<StoreState>)
      },
      partialize: (state: StoreState) => {
        // console.log('[Partialize]')
        const {
          apiEnabled,
          apiKey,
          apiPort,
          theme,
          colorMode,
          logoPath,
          preRunScript,
          postRunScript,
          outputDir,
          autoSave,
          recentFiles
        } = state.settings
        // Define only fields you want to persist
        return {
          settings: {
            apiEnabled,
            apiKey,
            apiPort,
            theme,
            colorMode,
            autoSave,
            recentFiles,
            logoPath,
            preRunScript,
            postRunScript,
            outputDir
          }
        } as unknown as Partial<StoreState>
      },
      onRehydrateStorage: (state) => {
        console.log('Hydration has started')
        console.log(state)
        // optional
        return (state, error) => {
          if (error) {
            console.log('an error happened during hydration', error)
          } else {
            console.log('hydration finished! hydrated state:')
            console.log(state)
          }
        }
      }
    }
  )
)
