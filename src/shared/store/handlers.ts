import { store } from '../../main/store'

// A handler is a function that receives the action and has access to the store.
const setData = ({ action }: { action: { payload: string | null } }) => {
  store.setState((state) => ({
    app: { ...state.app, data: action.payload, hasUnsavedChanges: true }
  }))
}

const setIsBusy = ({ action }: { action: { payload: boolean } }) => {
  store.setState((state) => ({
    app: { ...state.app, isBusy: action.payload }
  }))
}

const clearData = () => {
  store.setState((state) => ({
    app: { ...state.app, data: null, currentFilePath: null, hasUnsavedChanges: false }
  }))
}

const setTheme = (theme: 'light' | 'dark') => {
  store.setState((state) => ({
    settings: { ...state.settings, theme }
  }))
}

const setAutoSave = (autoSave: boolean) => {
  store.setState((state) => ({
    settings: { ...state.settings, autoSave }
  }))
}

const addRecentFile = (newFile: string) => {
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

const clearRecentFiles = () => {
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
