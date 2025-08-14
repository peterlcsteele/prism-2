import { configureStore } from '@reduxjs/toolkit'

// Slices
import { appSlice } from '../features/app/appSlice.js'
import { settingsSlice } from '../features/settings/settingsSlice.js'

// Create the Redux store
export const store = configureStore({
  reducer: {
    app: appSlice.reducer,
    settings: settingsSlice.reducer
  },
  // Optional middleware configuration
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false // Helpful for Electron IPC integration
    })
})

// Type inference for your application state
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
