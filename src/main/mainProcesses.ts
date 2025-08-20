import {
  app,
  BrowserWindow,
  dialog,
  shell,
  MessageBoxOptions,
  OpenDialogOptions,
  SaveDialogOptions,
  OpenDialogReturnValue,
  SaveDialogReturnValue,
  MessageBoxReturnValue
} from 'electron'
import path from 'node:path'
import os from 'node:os'
import process from 'node:process'
import fs from 'fs-extra'

// Types
import {
  EnvironmentData,
  DownloadParams,
  ReadFileParams,
  WriteFileParams,
  UnzipParams,
  ZipParams
} from '@shared/types'

// Zustand store and bridge instances
import { store } from './store'
import { bridge } from './bridge'

// Zip / Unzip
import archiver from 'archiver'
import extract from 'extract-zip'

// Download
import { download } from 'electron-dl'

// Machine ID
import { machineId } from 'node-machine-id'

// Dispatch
const { dispatch } = bridge

// System
export const getMachineId = async (): Promise<string> => {
  return machineId()
}

export const getEnvironmentData = (): EnvironmentData => {
  const envData: EnvironmentData = {
    filePrefix: os.platform() === `win32` ? `file:///` : `file://`,
    installDir: app.getAppPath(),
    platform: os.platform(),
    release: os.release(),
    workingDir: ''
  }
  if (process.platform === 'win32') {
    const baseDir = path.join(app.getPath('home'), 'AppData', 'Local')
    envData.workingDir = path.join(baseDir, 'PRISM-data')
  } else {
    envData.workingDir = path.join(app.getPath('documents'), 'PRISM')
  }
  return envData
}

// App
export const quitApp = (): void => {
  app.quit()
}

export const getAppVersion = (): string => {
  return app.getVersion()
}

export const getElectronVersion = (): string => {
  return process.versions.electron
}

export const addRecentDocument = (filePath: string): void => {
  app.addRecentDocument(filePath)
}

// File
export const downloadFile = async (
  window: BrowserWindow,
  { url, saveAs }: DownloadParams
): Promise<boolean> => {
  const { base, dir } = path.parse(saveAs)
  try {
    await download(window, url, {
      directory: dir,
      filename: base
    })
    return true
  } catch (err: unknown) {
    console.error(err)
    return false
  }
}

export const readFile = async ({ path, encoding = 'utf8' }: ReadFileParams): Promise<string> => {
  return fs.readFile(path, encoding)
}

export const writeFile = async ({
  path,
  data,
  encoding = 'utf8'
}: WriteFileParams): Promise<void> => {
  return fs.writeFile(path, data, encoding)
}

// Window
export const setWindowTitle = async (window: BrowserWindow, title: string): Promise<void> => {
  window.setTitle(`${app.getName()}: ${title}`)
}

// Archive
export const unzipArchive = async ({ zipPath, unzipPath }: UnzipParams): Promise<void> => {
  return extract(zipPath, {
    dir: unzipPath
  })
}

export const zipArchive = async ({ dirPath, zipPath }: ZipParams): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const output = fs.createWriteStream(zipPath)
    const archive = archiver('zip', { zlib: { level: 0 } })
    output.on('close', () => {
      console.log(`Zip created`)
      resolve(zipPath)
    })
    archive.on('warning', (data: archiver.ArchiverError) => {
      console.warn(data)
    })
    archive.on('error', (err: archiver.ArchiverError) => {
      reject(err)
    })
    archive.pipe(output)
    archive.directory(dirPath, false)
    archive.finalize()
  })
}

// Dialog
export const showMessageBox = async (
  window: BrowserWindow,
  options: MessageBoxOptions
): Promise<MessageBoxReturnValue> => {
  return dialog.showMessageBox(window, {
    ...options
  })
}

export const showOpenDialog = async (
  window: BrowserWindow,
  options: OpenDialogOptions
): Promise<OpenDialogReturnValue> => {
  const response = await dialog.showOpenDialog(window, options)
  // Add to recent
  if (response.filePaths[0]) {
    // Update OS recent docs
    app.addRecentDocument(response.filePaths[0])
    // Update store recent docs
    store.getState().settings.addRecentFile!(response.filePaths[0])!
  }
  return response
}

export const showSaveDialog = (
  window: BrowserWindow,
  options: SaveDialogOptions
): Promise<SaveDialogReturnValue> => {
  return dialog.showSaveDialog(window, options)
}

// Shell
export const openPath = (path: string): Promise<string> => {
  return shell.openPath(path)
}

export const openExternal = (url: string): Promise<void> => {
  return shell.openExternal(url)
}

export const showItemInFolder = (fullPath: string): void => {
  shell.showItemInFolder(fullPath)
}

// Flows
export const openFile = async (filePath: string | null = null): Promise<void> => {
  console.log('[MainProcesses] openFile()')

  // Enter busy state during file open operation (enables UI feedback/spinner)
  dispatch('app.setIsBusy', true)

  try {
    // If filePath is not provided, open a dialog for user to pick a file
    if (!filePath) {
      // Find the main window to attach dialog
      const window = BrowserWindow.getAllWindows()[0]!

      const { canceled, filePaths } = await dialog.showOpenDialog(window, {
        message: 'Select a text file to open',
        properties: ['openFile'],
        filters: [{ name: 'Text files', extensions: ['txt'] }]
      })

      // If the user cancelled or no files selected, exit early
      if (canceled || !filePaths || filePaths.length === 0) return

      // Use the first file path selected by the user
      filePath = filePaths[0]
    }

    // Ensure a non-empty filePath string
    if (!filePath) return

    // Read file contents in UTF-8
    const contents = await fs.readFile(filePath, 'utf8')

    // Update app state with new file data and path (enables downstream UI updates)
    dispatch('app.setData', contents)
    dispatch('app.setCurrentFilePath', filePath)
  } finally {
    // Ensure busy state is always reset, even if function exits early or errors
    dispatch('app.setIsBusy', false)
  }
}

export const importFile = async (): Promise<void> => {
  console.log('[MainProcesses] importFile()')

  // Enter busy state during file open operation (enables UI feedback/spinner)
  dispatch('app.setIsBusy', true)

  try {
    // Find the main window to attach dialog
    const window = BrowserWindow.getAllWindows()[0]!

    const { canceled, filePaths } = await dialog.showOpenDialog(window, {
      message: 'Select a text file to open',
      properties: ['openFile'],
      filters: [{ name: 'Text files', extensions: ['txt'] }]
    })

    // If the user cancelled or no files selected, exit early
    if (canceled || !filePaths || filePaths.length === 0) return

    // Use the first file path selected by the user
    const filePath = filePaths[0]

    // Ensure a non-empty filePath string
    if (!filePath) return

    // Read file contents in UTF-8
    const metadata = await fs.stat(filePath)

    // Update app state with new file data and path (enables downstream UI updates)
    dispatch('app.importMetadata', metadata)

    // Change view to import options
    window.webContents.send('show-import-options', { metadata })
  } finally {
    // Ensure busy state is always reset, even if function exits early or errors
    dispatch('app.setIsBusy', false)
  }
}

export const saveFile = async (): Promise<void> => {
  console.log('[MainProcesses] saveFile()')

  // Indicate start of file-saving operation (used for UI disable/spinner)
  dispatch('app.setIsBusy', true)

  try {
    // Retrieve file data to be saved from app state
    const fileData = store.getState().app.data

    // Ensure there is file data to save
    if (!fileData) return

    // Obtain current file path if already selected by the user
    let savePath = store.getState().app.currentFilePath

    // If this is the first save or Save As, prompt the user for a file location
    if (!savePath) {
      // Attach dialog to primary window instance
      const window = BrowserWindow.getAllWindows()[0]!

      const { canceled, filePath } = await dialog.showSaveDialog(window, {
        message: 'Select a file location to save your text',
        filters: [{ name: 'Text files', extensions: ['txt'] }]
      })

      // If the user cancels the dialog, exit early
      if (canceled || !filePath) return

      // Set the save path to the selected file location
      savePath = filePath
    }

    // Guard for possible empty path, though should be covered by above logic
    if (!savePath) return

    // Write file contents in UTF-8 encoding
    await fs.writeFile(savePath, fileData, 'utf8')

    // Persist the file path in the application state (may affect window title, etc.)
    dispatch('app.setCurrentFilePath', savePath)
  } finally {
    // Always reset busy status, regardless of how we exit the try block
    dispatch('app.setIsBusy', false)
  }
}

export const exportFile = async (format: string): Promise<void> => {
  console.log('[MainProcesses] exportFile()')

  const window = BrowserWindow.getAllWindows()[0]!
  window.webContents.send('show-export-options', { format })
}

export const showSettings = async (): Promise<void> => {
  const window = BrowserWindow.getAllWindows()[0]!
  window.webContents.send('show-settings')
}
