import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { preloadBridge } from '@zubridge/electron/preload'

const { handlers: zubridgeHandlers } = preloadBridge()

// Custom APIs for renderer
const api = {
  openFile: (filePath: string) => {
    ipcRenderer.send('open-file', filePath)
  },
  saveFile: () => {
    ipcRenderer.send('save-file')
  },
  // Send events
  showOpenDialog: async (options) => {
    return ipcRenderer.invoke('dialog:show-open-dialog', options)
  },
  showMessageBox: async (options) => {
    return ipcRenderer.invoke('dialog:show-message-box', options)
  },
  showSaveDialog: async (options) => {
    return ipcRenderer.invoke('dialog:show-save-dialog', options)
  },
  readFile: async (options) => {
    return ipcRenderer.invoke('file:read', options)
  },
  writeFile: async (options) => {
    return ipcRenderer.invoke('file:write', options)
  },
  showItemInFolder: (fullPath) => {
    return ipcRenderer.send('shell:show-item-in-folder', fullPath)
  },
  updateMenuState: (state) => {
    return ipcRenderer.send('menu:update-state', state)
  },
  // Receive events
  onMenuOpen: (callback) => {
    const handler = (_event, ...args): void => callback(...args)
    ipcRenderer.on('menu:open', handler)
    return () => ipcRenderer.off('menu:open', handler)
  },
  onMenuImport: (callback) => {
    const handler = (_event, ...args): void => callback(...args)
    ipcRenderer.on('menu:import', handler)
    return () => ipcRenderer.off('menu:import', handler)
  },
  onMenuClose: (callback) => {
    const handler = (_event, ...args): void => callback(...args)
    ipcRenderer.on('menu:close', handler)
    return () => ipcRenderer.off('menu:close', handler)
  },
  onMenuSave: (callback) => {
    const handler = (_event, ...args): void => callback(...args)
    ipcRenderer.on('menu:save', handler)
    return () => ipcRenderer.off('menu:save', handler)
  },
  onMenuSaveAs: (callback) => {
    const handler = (_event, ...args): void => callback(...args)
    ipcRenderer.on('menu:save-as', handler)
    return () => ipcRenderer.off('menu:save-as', handler)
  },
  onMenuExport: (callback) => {
    const handler = (_event, ...args): void => callback(...args)
    ipcRenderer.on('menu:export', handler)
    return () => ipcRenderer.off('menu:export', handler)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('zubridge', zubridgeHandlers)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
  /// @ts-ignore (define in dts)
  window.zubridge = zubridgeHandlers
}
