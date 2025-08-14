import { app, shell, BrowserWindow } from 'electron'
import path, { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

import { setupAppMenu } from './menu'
import { setupIpcHandlers } from './ipcHandlers'

// Redux store
import { store } from '@shared/store/main'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    // Show window
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Open dev tools
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools()
  }

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Setup app menu with store
  setupAppMenu(store)
  // Setup IPC handlers with store
  setupIpcHandlers(store)

  // Subscribe to store changes and update menu
  const updateWindowTitle = () => {
    const state = store.getState()
    // Get current filename
    const { currentFilePath } = state.app
    mainWindow?.setTitle(currentFilePath ? path.basename(currentFilePath) : 'Untitled')
  }
  store.subscribe(updateWindowTitle)
}

// Check if only instance
const isOnlyInstance = app.requestSingleInstanceLock()
if (!isOnlyInstance) {
  // Quit if another instance is already running
  app.exit()
} else {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(() => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('dev.xs1.prism')

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    createWindow()

    app.on('activate', function () {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  // Quit when all windows are closed
  app.on('window-all-closed', () => {
    app.quit()
  })

  // Handle second instance attempts
  app.on('second-instance', () => {
    // Return focus to existing window
    if (mainWindow) {
      // Bounce the app icon (macOS)
      if (process.platform === 'darwin') {
        app.dock?.bounce()
      }

      // Restore window if minimized
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }

      // Focus window
      mainWindow.focus()
    }
  })
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
