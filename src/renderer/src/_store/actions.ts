export const appActions = {
  setData: (data: string | null) => ({
    type: 'app.setData',
    payload: data
  }),
  setIsBusy: (isBusy: boolean) => ({
    type: 'app.setIsBusy',
    payload: isBusy
  }),
  setCurrentFilePath: (path: string | null) => ({
    type: 'app.setCurrentFilePath',
    payload: path
  }),
  clearData: () => ({
    type: 'app.clearData'
  })
}

export const settingsActions = {
  setTheme: (theme: 'light' | 'dark') => ({
    type: 'settings.setTheme',
    payload: theme
  }),
  setAutoSave: (autoSave: boolean) => ({
    type: 'settings.setAutoSave',
    payload: autoSave
  }),
  addRecentFile: (path: string) => ({
    type: 'settings.addRecentFile',
    payload: path
  }),
  clearRecentFiles: () => ({
    type: 'settings.clearRecentFiles'
  })
}
