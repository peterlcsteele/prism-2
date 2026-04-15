import {
  app,
  BrowserWindow,
  clipboard,
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

import { v4 as uuidv4 } from 'uuid'

// Types
import {
  EnvironmentData,
  DownloadParams,
  ReadFileParams,
  WriteFileParams,
  UnzipParams,
  ZipParams,
  SettingsValidationSchema
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
import { convertXMLToJS, getAppSlug } from './utils'
import { apiServer } from './apiServer'
import { is } from '@electron-toolkit/utils'
import { getWindowById } from './windowManager'

// Dispatch
const { dispatch } = bridge

type APIServerEnableSource = 'launch' | 'user'

type AppNotificationPayload = {
  level: 'info' | 'warning' | 'error'
  title: string
  message: string
  action?: {
    label: string
    section?: string
  }
}

const sendToMainWindow = (channel: string, payload: AppNotificationPayload): void => {
  const mainWindow = getWindowById('main')
  if (!mainWindow || mainWindow.isDestroyed()) return

  const send = (): void => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send(channel, payload)
    }
  }

  if (mainWindow.webContents.isLoadingMainFrame()) {
    mainWindow.webContents.once('did-finish-load', send)
    return
  }

  send()
}

const isPortInUseError = (err: unknown): boolean => {
  const message = err instanceof Error ? err.message : String(err)
  return message.includes('EADDRINUSE') || message.includes('already in use')
}

// System
export const getMachineId = async (): Promise<string> => {
  return machineId()
}

// Environment data
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

// Read and Write
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

// Settings: Import, export and reset
export const importSettings = async (): Promise<void> => {
  console.log('[MainProcesses] importSettings()')

  dispatch('app.setIsBusy', true)

  try {
    const window = BrowserWindow.getAllWindows()[0]!
    const { canceled, filePaths } = await dialog.showOpenDialog(window, {
      message: 'Import settings',
      properties: ['openFile'],
      filters: [{ name: '', extensions: ['json'] }]
    })

    // If the user cancelled or no files selected, exit early
    if (canceled || !filePaths || filePaths.length === 0) return

    // Get filepath
    const filePath = filePaths[0]

    if (!filePath) return

    // Open file
    const settings = await fs.readJson(filePath)

    // Validate settings using Zod
    console.log('------====== VALIDATION ======------')
    const { success, error, data } = SettingsValidationSchema.safeParse(settings)

    if (!success) {
      await dialog.showMessageBox(window, {
        message: 'Import failed',
        detail: error.issues
          .reduce((acc, error) => {
            return acc + `'${error.path}' - ${error.message}.\r\n\r\n`
          }, '')
          .trim()
      })
      return
    }

    // Set valid settings
    dispatch('settings.setSettings', data)

    await dialog.showMessageBox(window, {
      message: 'Settings imported',
      buttons: ['Done']
    })
  } finally {
    // Ensure busy state is always reset, even if function exits early or errors
    dispatch('app.setIsBusy', false)
  }
}
export const exportSettings = async (): Promise<void> => {
  console.log('[MainProcesses] exportSettings()')

  dispatch('app.setIsBusy', true)

  try {
    // Get name
    const appNameSafe = getAppSlug()

    // Dialog
    const window = BrowserWindow.getAllWindows()[0]!
    const { canceled, filePath } = await dialog.showSaveDialog(window, {
      message: 'Export settings',
      defaultPath: `settings-${appNameSafe}.json`,
      filters: [{ name: '', extensions: ['json'] }]
    })

    // If the user cancelled or no files selected, exit early
    if (canceled || !filePath || filePath.length === 0) return

    // Get settings
    const settings = store.getState().settings

    // Save file
    await fs.writeJson(filePath, settings)

    const { response } = await dialog.showMessageBox(window, {
      message: 'Settings exported',
      defaultId: 1,
      buttons: ['Show in Finder', 'Done']
    })

    if (response === 0) {
      shell.showItemInFolder(filePath)
    }
  } finally {
    dispatch('app.setIsBusy', false)
  }
}
export const resetSettings = async (): Promise<void> => {
  console.log('[MainProcesses] resetSettings()')

  dispatch('app.setIsBusy', true)

  const window = BrowserWindow.getAllWindows()[0]!
  const { response } = await dialog.showMessageBox(window, {
    message: 'Restore defaults\r\nAre you sure?',
    buttons: ['Restore', 'Cancel'],
    defaultId: 1
  })

  if (response === 0) {
    dispatch('settings.restoreDefaults')
  }

  dispatch('app.setIsBusy', false)
}

// General: Write to clipboard
export const writeToClipboard = (text: string): void => {
  clipboard.writeText(text)
}

// Windows
export const openSettings = (section?: string): void => {
  // Check if existing settings window exists

  let settingsWindow = BrowserWindow.getAllWindows().find((w) =>
    w.webContents.getURL().includes('/#/settings')
  )

  const openSection = (window: BrowserWindow): void => {
    const payload = section ? { section } : undefined

    const send = (): void => {
      if (!window.isDestroyed()) {
        window.webContents.send('show-settings', payload)
      }
    }

    if (window.webContents.isLoadingMainFrame()) {
      window.webContents.once('did-finish-load', send)
      return
    }

    send()
  }

  if (settingsWindow) {
    console.log('Existing settings window found. Focusing that window...')
    openSection(settingsWindow)
    settingsWindow.focus()
  } else {
    // Get main window
    const mainWindow = BrowserWindow.getAllWindows().find((win) => {
      console.log(win.webContents.getURL())
      return win.webContents.getURL().endsWith('/')
    })

    console.log('Creating new settings window')
    settingsWindow = new BrowserWindow({
      parent: mainWindow,
      title: app.getName() + ' - Settings',
      width: 640,
      height: 720,
      show: false,
      autoHideMenuBar: true,
      backgroundColor: '#000000',
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        sandbox: false,
        webSecurity: process.env.NODE_ENV !== 'development'
      }
    })

    // Subscribe window to bridge
    bridge.subscribe([settingsWindow])

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      settingsWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/#/settings')
    } else {
      settingsWindow.loadFile(path.join(__dirname, '../renderer/index.html/#/settings'))
    }

    openSection(settingsWindow)
    settingsWindow.once('ready-to-show', () => settingsWindow!.show())
  }
}

// Settings: API Enabled
export const setAPIServerEnabled = async (
  isEnabled: boolean,
  source: APIServerEnableSource = 'user'
): Promise<void> => {
  dispatch('app.setIsBusy', true)

  // Get port and key
  const { apiKey, apiPort } = store.getState().settings

  if (isEnabled) {
    if (!apiKey) {
      dialog.showMessageBox({
        message: 'API key is missing',
        detail: 'Generate an API key before enabling the API server.'
      })
      dispatch('app.setIsBusy', false)
      return
    }

    try {
      await apiServer.start(apiPort, apiKey)
      dispatch('settings.setSettings', { apiEnabled: true })
    } catch (err) {
      dispatch('settings.setSettings', { apiEnabled: false })

      if (source === 'launch' && isPortInUseError(err)) {
        sendToMainWindow('app:notify', {
          level: 'warning',
          title: 'API server unavailable',
          message: `Port ${apiPort} is in use. Open Settings to choose a different port.`,
          action: {
            label: 'Settings',
            section: 'api-server'
          }
        })
      } else {
        dialog.showMessageBox({
          message: 'Could not start server',
          detail: String(err)
        })
      }
    } finally {
      dispatch('app.setIsBusy', false)
    }
  } else {
    apiServer.stop()
    dispatch('settings.setSettings', { apiEnabled: false })
    dispatch('app.setIsBusy', false)
  }
}
// Settings: API Key
export const generateAPIKey = async (): Promise<void> => {
  console.log(`[MainProcesses] generateAPIKey()`)

  // TODO: Confirm API server is not running.

  dispatch('app.setIsBusy', true)

  try {
    const { response } = await dialog.showMessageBox({
      message:
        'Generate new API key? \r\n\r\nYou must update any integrations with the new API key',
      buttons: ['Continue', 'Cancel'],

      defaultId: 1,
      cancelId: 1
    })
    // If canceled
    if (response === 1) return

    // Generate new api key
    const apiKey = getAppSlug() + '_' + uuidv4().replaceAll('-', '')

    // Update store
    dispatch('settings.setSettings', { apiKey })
  } finally {
    dispatch('app.setIsBusy', false)
  }
}

// Settings: Open at login
export const getOpenAtLogin = (): boolean => {
  console.log(`[MainProcesses] getOpenAtLogin()`)
  return app.getLoginItemSettings().openAtLogin
}
export const setOpenAtLogin = (value: boolean): boolean => {
  console.log(`[MainProcesses] setOpenAtLogin(${value})`)
  // Set open as login
  app.setLoginItemSettings({
    openAtLogin: value
  })
  // Return value if successful
  return value
}

// Output directory
export const setOutputDir = async (): Promise<void> => {
  console.log('[MainProcesses] setOutputDir()')

  // Enter busy state during file open operation (enables UI feedback/spinner)
  dispatch('app.setIsBusy', true)

  try {
    // Find the main window to attach dialog
    const window = BrowserWindow.getAllWindows()[0]!

    const { canceled, filePaths } = await dialog.showOpenDialog(window, {
      message: 'Select output directory',
      properties: ['openDirectory']
    })

    // If the user cancelled or no files selected, exit early
    if (canceled || !filePaths || filePaths.length === 0) return

    // Use the first file path selected by the user
    const outputDir = filePaths[0]

    // Ensure a non-empty filePath string
    if (!outputDir) return

    // Update app state with new file data and path (enables downstream UI updates)
    dispatch('settings.setSettings', { outputDir })
  } finally {
    // Ensure busy state is always reset, even if function exits early or errors
    dispatch('app.setIsBusy', false)
  }
}

// Logo
export const setLogoPath = async (): Promise<void> => {
  console.log('[MainProcesses] setLogoPath()')

  // Enter busy state during file open operation (enables UI feedback/spinner)
  dispatch('app.setIsBusy', true)

  try {
    // Find the main window to attach dialog
    const window = BrowserWindow.getAllWindows()[0]!

    const { canceled, filePaths } = await dialog.showOpenDialog(window, {
      message: 'Select logo',
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }]
    })

    // If the user cancelled or no files selected, exit early
    if (canceled || !filePaths || filePaths.length === 0) return

    // Use the first file path selected by the user
    const logoPath = filePaths[0]

    // Ensure a non-empty filePath string
    if (!logoPath) return

    // Update app state with new file data and path (enables downstream UI updates)
    dispatch('settings.setSettings', { logoPath })
  } finally {
    // Ensure busy state is always reset, even if function exits early or errors
    dispatch('app.setIsBusy', false)
  }
}
export const clearLogoPath = async (): Promise<void> => {
  console.log('[MainProcesses] clearLogoPath()')

  // Find the main window to attach dialog
  const window = BrowserWindow.getAllWindows()[0]!

  const { response } = await dialog.showMessageBox(window, {
    message: 'Remove selected logo?',
    buttons: ['Remove', 'Browse and replace', 'Cancel'],
    defaultId: 2
  })

  switch (response) {
    case 0:
      // Update app state
      dispatch('settings.setSettings', { logoPath: null })
      break
    case 1:
      setLogoPath()
      break
    default:
      return
  }
}

// Pre-run and Post-run scripts
export const setPreRunScript = async (): Promise<void> => {
  console.log('[MainProcesses] setPreRunScript()')

  // Enter busy state during file open operation (enables UI feedback/spinner)
  dispatch('app.setIsBusy', true)

  try {
    // Find the main window to attach dialog
    const window = BrowserWindow.getAllWindows()[0]!

    const scriptExtensionsByPlatform = {
      win32: ['bat', 'cmd', 'ps1', 'vbs'],
      darwin: ['sh', 'zsh', 'command', 'bash'],
      linux: ['sh', 'bash', 'py', 'pl']
    }

    const extensions = scriptExtensionsByPlatform[process.platform]

    const { canceled, filePaths } = await dialog.showOpenDialog(window, {
      message: 'Select pre-run script',
      properties: ['openFile'],
      filters: [{ name: 'Scripts', extensions }]
    })

    // If the user cancelled or no files selected, exit early
    if (canceled || !filePaths || filePaths.length === 0) return

    // Use the first file path selected by the user
    const filePath = filePaths[0]

    // Ensure a non-empty filePath string
    if (!filePath) return

    // Update app state with new file data and path (enables downstream UI updates)
    dispatch('settings.setSettings', { preRunScript: filePath })
  } finally {
    // Ensure busy state is always reset, even if function exits early or errors
    dispatch('app.setIsBusy', false)
  }
}
export const setPostRunScript = async (): Promise<void> => {
  console.log('[MainProcesses] setPostRunScript()')

  // Enter busy state during file open operation (enables UI feedback/spinner)
  dispatch('app.setIsBusy', true)

  try {
    // Find the main window to attach dialog
    const window = BrowserWindow.getAllWindows()[0]!

    const scriptExtensionsByPlatform = {
      win32: ['bat', 'cmd', 'ps1', 'vbs'],
      darwin: ['sh', 'zsh', 'command', 'bash'],
      linux: ['sh', 'bash', 'py', 'pl']
    }

    const extensions = scriptExtensionsByPlatform[process.platform]

    const { canceled, filePaths } = await dialog.showOpenDialog(window, {
      message: 'Select post-run script',
      properties: ['openFile'],
      filters: [{ name: 'Scripts', extensions }]
    })

    // If the user cancelled or no files selected, exit early
    if (canceled || !filePaths || filePaths.length === 0) return

    // Use the first file path selected by the user
    const filePath = filePaths[0]

    // Ensure a non-empty filePath string
    if (!filePath) return

    // Update app state with new file data and path (enables downstream UI updates)
    dispatch('settings.setSettings', { postRunScript: filePath })
  } finally {
    // Ensure busy state is always reset, even if function exits early or errors
    dispatch('app.setIsBusy', false)
  }
}

// Window
export const setWindowTitle = async (window: BrowserWindow, title: string): Promise<void> => {
  window.setTitle(`${app.getName()}: ${title}`)
}

// Unzip / Zip
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
    dispatch('settings.addRecentFile', response.filePaths[0])
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
      // const window = BrowserWindow.getAllWindows()[0]!

      const { canceled, filePaths } = await dialog.showOpenDialog({
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
      filters: [{ name: 'Supported files', extensions: ['.zip'] }]
    })

    // If the user cancelled or no files selected, exit early
    if (canceled || !filePaths || filePaths.length === 0) return

    // Use the first file path selected by the user
    const filePath = filePaths[0]

    // Ensure a non-empty filePath string
    if (!filePath) return

    // Get temp dir
    const targetDir = path.join(app.getPath('documents'), 'prism2', 'temp')

    // Unzip file
    const result = await extract(filePath, {
      dir: targetDir
    })
    console.log(result)

    // Read imsmanifest.xml package
    const manifestPath = path.join(targetDir, 'imsmanifest.xml')
    const manifestContents = await fs.readFile(manifestPath, 'utf8')

    // Convert manifest to js.
    const root = convertXMLToJS(manifestContents)

    const toc = root.manifest.organizations.organization.item
    console.log(toc)

    // Get resources
    const resources = root.manifest.resources.resource
    console.log(resources)

    const convertToStructure = (items): unknown => {
      // Ensure items is array
      items = Array.isArray(items) ? items : [items]

      return items.reduce((acc, item) => {
        // Get this items matching resource info
        const resource = resources.find((r) => r.identifier === item.identifierref)

        // Create new item
        const newItem = {
          ...resource,
          id: uuidv4(),
          title: item.title ?? resource['bb:title']
        }

        // Delete item
        delete newItem['bb:title']

        // Get and convert child items
        const { item: children } = item
        if (children) {
          newItem.children = convertToStructure(item.item)
        }
        // Add to accumulator and return
        acc.push(newItem)
        return acc
      }, [])
    }

    // Convert to structure
    const structure = convertToStructure(toc)
    console.log(structure)

    // Add to store
    dispatch('app.setTree', structure)

    // Show import options
    window.webContents.send('show-import-options')
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

// export const showSettings = async (): Promise<void> => {
// const window = BrowserWindow.getAllWindows()[0]!
// window.webContents.send('show-settings')

// }

// Register API methods
apiServer.registerAPI({
  version: getAppVersion
})
