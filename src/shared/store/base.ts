import { configureStore, Store, StoreEnhancer } from '@reduxjs/toolkit'
import { appSlice } from './slices/appSlice'
import { settingsSlice } from './slices/settingsSlice'

export const createStore = (enhancer?: StoreEnhancer): Store => {
  return configureStore({
    reducer: {
      app: appSlice.reducer,
      settings: settingsSlice.reducer
    },
    enhancers: enhancer
      ? (getDefaultEnhancers) => getDefaultEnhancers().concat(enhancer)
      : undefined
  })
}

export type RootState = ReturnType<ReturnType<typeof createStore>['getState']>
export type AppDispatch = ReturnType<typeof createStore>['dispatch']
