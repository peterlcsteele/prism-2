import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface AppState {
  data: string | null
  isBusy: boolean
  currentFilePath: string | null
  hasUnsavedChanges: boolean
}

const initialState: AppState = {
  data: null,
  isBusy: false,
  currentFilePath: null,
  hasUnsavedChanges: false
}

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setData: (state, action: PayloadAction<string | null>) => {
      state.data = action.payload
    },
    setIsBusy: (state, action: PayloadAction<boolean>) => {
      state.isBusy = action.payload
    },
    setCurrentFilePath: (state, action: PayloadAction<string | null>) => {
      state.currentFilePath = action.payload
    },
    clearData: (state) => {
      state.data = null
      state.currentFilePath = null
    }
  }
})

export const { setData, setIsBusy, setCurrentFilePath, clearData } = appSlice.actions
