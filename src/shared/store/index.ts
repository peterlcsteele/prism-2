// Export state and dispatch
export { type RootState, type AppDispatch } from '@shared/store/base'

// Export slices
export { appSlice } from './slices/appSlice'
export { settingsSlice } from './slices/settingsSlice'

// Export action creators
export { setData, setIsBusy, setCurrentFilePath, clearData } from './slices/appSlice'
export { setTheme, setAutoSave, addRecentFile, clearRecentFiles } from './slices/settingsSlice'
