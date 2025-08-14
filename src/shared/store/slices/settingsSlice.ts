import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface SettingsState {
  theme: 'light' | 'dark'
  autoSave: boolean
  recentFiles: string[]
}

const initialState: SettingsState = {
  theme: 'light',
  autoSave: true,
  recentFiles: []
}

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload
    },
    setAutoSave: (state, action: PayloadAction<boolean>) => {
      state.autoSave = action.payload
    },
    addRecentFile: (state, action: PayloadAction<string>) => {
      const newFile = action.payload
      // Add to front and remove duplicates, limit to 10
      state.recentFiles = [newFile, ...state.recentFiles.filter((f) => f !== newFile)].slice(0, 10)
    },
    clearRecentFiles: (state) => {
      state.recentFiles = []
    }
  }
})

export const { setTheme, setAutoSave, addRecentFile, clearRecentFiles } = settingsSlice.actions
