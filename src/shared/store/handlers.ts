import type { Handler } from '@zubridge/electron'
import { store } from '../../main/store'

// A handler is a function that receives the action and has access to the store.
const setData: Handler = ({ action }) => {
  store.setState((state) => ({
    app: { ...state.app, data: action.payload, hasUnsavedChanges: true }
  }))
}

const setIsBusy: Handler = ({ action }) => {
  store.setState((state) => ({
    app: { ...state.app, isBusy: action.payload }
  }))
}

const clearData: Handler = () => {
  store.setState((state) => ({
    app: { ...state.app, data: null, currentFilePath: null, hasUnsavedChanges: false }
  }))
}

const setTheme: Handler = (theme: 'light' | 'dark') => {
  store.setState((state) => ({
    settings: { ...state.settings, theme }
  }))
}

const setAutoSave: Handler = (autoSave: boolean) => {
  store.setState((state) => ({
    settings: { ...state.settings, autoSave }
  }))
}

const addRecentFile: Handler = (newFile: string) => {
  store.setState((state) => ({
    settings: {
      ...state.settings,
      recentFiles: [newFile, ...state.settings.recentFiles.filter((f) => f !== newFile)].slice(
        0,
        10
      )
    }
  }))
}

const clearRecentFiles: Handler = () => {
  store.setState((state) => ({
    settings: {
      ...state.settings,
      recentFiles: []
    }
  }))
}

export const handlers = {
  'app/setData': setData,
  'app/setIsBusy': setIsBusy,
  'app/clearData': clearData,
  'settings/setTheme': setTheme,
  'settings/setAutoSave': setAutoSave,
  'settings/addRecentFile': addRecentFile,
  'settings/clearRecentFiles': clearRecentFiles
}
