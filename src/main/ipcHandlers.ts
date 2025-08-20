import {
  BrowserWindow,
  ipcMain,
  IpcMainInvokeEvent,
  IpcMainEvent,
  MessageBoxOptions,
  OpenDialogOptions,
  SaveDialogOptions,
  OpenDialogReturnValue,
  SaveDialogReturnValue,
  MessageBoxReturnValue
} from 'electron'

// Main Processes
import {
  addRecentDocument,
  downloadFile,
  getAppVersion,
  getElectronVersion,
  getEnvironmentData,
  getMachineId,
  openExternal,
  openFile,
  openPath,
  quitApp,
  readFile,
  saveFile,
  setWindowTitle,
  showMessageBox,
  showOpenDialog,
  showSaveDialog,
  showItemInFolder,
  unzipArchive,
  writeFile,
  zipArchive
} from './mainProcesses'

// Types
import {
  EnvironmentData,
  DownloadParams,
  ReadFileParams,
  WriteFileParams,
  UnzipParams,
  ZipParams
} from '@shared/types'

export const setupIpcHandlers = (): void => {
  const focusedWindow = BrowserWindow.getAllWindows()[0]!

  // System
  ipcMain.handle('system:get-machine-id', async (): Promise<string> => {
    console.log('[ipcMain] app:get-machine-id')
    return getMachineId()
  })
  ipcMain.handle('system:get-environment-data', (): EnvironmentData => {
    console.log('[ipcMain] system:get-environment-data')
    return getEnvironmentData()
  })

  // App
  ipcMain.on('app:quit', (): void => {
    console.log('[ipcMain] app:quit')
    quitApp()
  })
  ipcMain.handle('app:get-version', (): string => {
    console.log('[ipcMain] app:get-version')
    return getAppVersion()
  })
  ipcMain.handle('app:get-electron-version', (): string => {
    console.log('[ipcMain] app:get-electron-version')
    return getElectronVersion()
  })
  ipcMain.handle(
    'app:add-recent-document',
    (_event: IpcMainInvokeEvent, filePath: string): void => {
      console.log(`[ipcMain] app:add-recent-document: ${filePath}`)
      addRecentDocument(filePath)
    }
  )

  // File
  ipcMain.on('open-file', (_event: IpcMainEvent, filePath: string | null = null): void => {
    console.log('[ipcMain] open-file')
    openFile(filePath)
  })
  ipcMain.on('save-file', (_event: IpcMainEvent): void => {
    console.log('[ipcMain] save-file')
    saveFile()
  })
  ipcMain.handle(
    'file:download',
    async (_event: IpcMainInvokeEvent, { url, saveAs }: DownloadParams): Promise<boolean> => {
      console.log(`[ipcMain] file:download: ${url}`)
      return downloadFile(focusedWindow, { url, saveAs })
    }
  )
  ipcMain.handle(
    'file:read',
    async (_event: IpcMainInvokeEvent, params: ReadFileParams): Promise<string> => {
      console.log('[ipcMain] file:read')
      return readFile(params)
    }
  )
  ipcMain.handle(
    'file:write',
    async (_event: IpcMainInvokeEvent, params: WriteFileParams): Promise<void> => {
      console.log(`[ipcMain] file:write (${params.path})`)
      return writeFile(params)
    }
  )

  // Window
  ipcMain.handle(
    'window:set-title',
    async (_event: IpcMainInvokeEvent, title: string): Promise<void> => {
      console.log(`[ipcMain] window:set-title: '${title}'`)
      setWindowTitle(focusedWindow, title)
    }
  )

  // Archive
  ipcMain.handle(
    'archive:unzip',
    async (_event: IpcMainInvokeEvent, params: UnzipParams): Promise<void> => {
      console.log(`[ipcMain] archive:unzip: '${params.zipPath}'`)
      return unzipArchive(params)
    }
  )
  ipcMain.handle(
    'archive:zip',
    async (_event: IpcMainInvokeEvent, params: ZipParams): Promise<string> => {
      console.log(`[ipcMain] archive:zip: '${params.dirPath}'`)
      return zipArchive(params)
    }
  )

  // Dialog
  ipcMain.handle(
    'dialog:show-message-box',
    async (
      _event: IpcMainInvokeEvent,
      options: MessageBoxOptions
    ): Promise<MessageBoxReturnValue> => {
      console.log('[ipcMain] showMessageBox')
      return showMessageBox(focusedWindow, options)
    }
  )
  ipcMain.handle(
    'dialog:show-open-dialog',
    async (
      _event: IpcMainInvokeEvent,
      options: OpenDialogOptions
    ): Promise<OpenDialogReturnValue> => {
      console.log(`[ipcMain] dialog:show-open-dialog`)
      return showOpenDialog(focusedWindow, options)
    }
  )
  ipcMain.handle(
    'dialog:show-save-dialog',
    (_event: IpcMainInvokeEvent, options: SaveDialogOptions): Promise<SaveDialogReturnValue> => {
      console.log(`[ipcMain] dialog:show-save-dialog`)
      return showSaveDialog(focusedWindow, options)
    }
  )

  // Shell
  ipcMain.on('shell:open-path', (_event: IpcMainEvent, path: string): void => {
    console.log(`[ipcMain] shell:open-path: ${path}`)
    openPath(path)
  })
  ipcMain.on('shell:open-external', (_event: IpcMainEvent, url: string): void => {
    console.log(`[ipcMain] shell:open-external: ${url}`)
    openExternal(url)
  })
  ipcMain.on('shell:show-item-in-folder', (_event: IpcMainEvent, fullPath: string): void => {
    console.log(`[ipcMain shell:show-item-in-folder: ${fullPath}`)
    showItemInFolder(fullPath)
  })
}
